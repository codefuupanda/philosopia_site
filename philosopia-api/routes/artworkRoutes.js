import express from 'express';
import { listByType } from '../db/content.js';

const router = express.Router();

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Public
router.get('/', async (req, res) => {
    try {
        const artworks = await listByType('artwork');
        // _id: legacy key compat (frontend uses _id for React keys)
        res.json(artworks.map((a) => ({ ...a, _id: a.id })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
