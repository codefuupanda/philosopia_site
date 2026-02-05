import express from 'express';
import Artwork from '../models/Artwork.js';

const router = express.Router();

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Public
router.get('/', async (req, res) => {
    try {
        const artworks = await Artwork.find({});
        res.json(artworks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
