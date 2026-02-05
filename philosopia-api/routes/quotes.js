import express from 'express';
import Quote from '../models/Quote.js';

const router = express.Router();

// GET /api/quotes
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.tag) {
            filters.tags = req.query.tag;
        }
        if (req.query.philosopherId) {
            filters.philosopherId = req.query.philosopherId;
        }

        const quotes = await Quote.find(filters)
            .populate('philosopher')
            .populate('work');

        res.json(quotes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
