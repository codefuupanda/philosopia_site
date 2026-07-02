import express from 'express';
import { listByType, getByIds } from '../db/content.js';
import { withFlatAliases } from '../db/aliases.js';

const router = express.Router();

// GET /api/works
router.get('/', async (req, res) => {
    try {
        const works = await listByType('work');
        const philById = await getByIds('philosopher', works.map((w) => w.philosopherId));

        const out = works.map((w) => {
            const p = philById.get(w.philosopherId);
            return {
                ...withFlatAliases('work', w),
                _id: w.id, // legacy key compat (frontend uses _id for React keys)
                philosopher: p
                    ? withFlatAliases('philosopher', { id: p.id, name: p.name, imageUrl: p.imageUrl })
                    : null,
            };
        });
        res.json(out);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
