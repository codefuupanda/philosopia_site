import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

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

        const user = await User.findOne({ username: username.trim() });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id),
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

        const userExists = await User.findOne({ username: trimmedUsername });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username: trimmedUsername,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
