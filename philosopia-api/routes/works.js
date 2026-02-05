import express from 'express';
import Work from '../models/Work.js';

const router = express.Router();

// GET /api/works
router.get('/', async (req, res) => {
    try {
        const works = await Work.find().populate('philosopher');
        res.json(works);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
