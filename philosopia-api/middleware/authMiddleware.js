import jwt from 'jsonwebtoken';
import { getByUsername } from '../db/users.js';
import { JWT_ALGORITHM, validateJwtConfig } from '../config/auth.js';

export const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const match = typeof authorization === 'string' && /^Bearer (\S+)$/i.exec(authorization);
    if (!match) {
        return res.status(401).json({ message: 'Not authorized, no valid bearer token' });
    }

    let decoded;
    try {
        decoded = jwt.verify(match[1], validateJwtConfig(), { algorithms: [JWT_ALGORITHM] });
        if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'string' ||
            !decoded.id.trim() || decoded.id !== decoded.id.trim() ||
            typeof decoded.exp !== 'number') {
            return res.status(401).json({ message: 'Not authorized, invalid token claims' });
        }
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    let user;
    try {
        // getByUsername uses a strongly consistent read. Never authorize from
        // token role claims or cached account data: deletion/demotion revokes access.
        user = await getByUsername(decoded.id);
    } catch {
        return res.status(503).json({ message: 'Authentication service unavailable' });
    }

    if (!user || user.username !== decoded.id) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = { id: user.username, role: user.role };
    return next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    return next();
};
