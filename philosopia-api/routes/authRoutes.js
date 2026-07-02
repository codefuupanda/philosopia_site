import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getByUsername, putUser } from '../db/users.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Token subject is the username (the users table PK — no ObjectIds in DynamoDB).
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

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

// @desc    Register a new admin (Internal use only)
// @route   POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const trimmedUsername = username.trim();

        const userExists = await getByUsername(trimmedUsername);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hashing happens here now (replaces the Mongoose pre-save hook)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await putUser({ username: trimmedUsername, passwordHash });

        res.status(201).json({
            _id: user.username,
            username: user.username,
            token: generateToken(user.username),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
