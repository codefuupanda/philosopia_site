const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');

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

module.exports = router;
