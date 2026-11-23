import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getByUsername, putUser } from '../db/users.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { JWT_ALGORITHM, validateJwtConfig } from '../config/auth.js';

const router = express.Router();

// Preserve the existing username-based `id` claim and 30-day token lifetime.
const generateToken = (id) => {
    return jwt.sign({ id }, validateJwtConfig(), {
        algorithm: JWT_ALGORITHM,
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await getByUsername(username.trim());

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.username, // legacy key compat (was the Mongo ObjectId)
                username: user.username,
                token: generateToken(user.username),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Register a new admin (existing admins only)
// @route   POST /api/auth/register
router.post('/register', authLimiter, protect, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const trimmedUsername = typeof username === 'string' ? username.trim() : '';

        if (!trimmedUsername || trimmedUsername.length > 128 || /[\u0000-\u001f\u007f]/.test(trimmedUsername)) {
            return res.status(400).json({ message: 'Username must be 1–128 characters without control characters' });
        }

        // bcrypt truncates input beyond 72 UTF-8 bytes. Reject rather than
        // silently treating two different passwords as equivalent.
        if (typeof password !== 'string' || !password.trim() || Array.from(password).length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({ message: 'Password must contain at least 12 characters and at most 72 UTF-8 bytes' });
        }

        // Sign before writing so a configuration/signing failure cannot leave
        // behind an account from an unsuccessful registration request.
        const token = generateToken(trimmedUsername);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await putUser({ username: trimmedUsername, passwordHash, role: 'admin' });

        res.status(201).json({
            _id: user.username,
            username: user.username,
            token,
        });
    } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ message: 'User already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
