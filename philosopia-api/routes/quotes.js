import express from 'express';
import { listByType, getByIds } from '../db/content.js';
import { withFlatAliases } from '../db/aliases.js';

const router = express.Router();

// GET /api/quotes
router.get('/', async (req, res) => {
    try {
        let quotes = await listByType('quote');

        if (req.query.tag) {
            quotes = quotes.filter((q) => (q.tags || []).includes(req.query.tag));
        }
        if (req.query.philosopherId) {
            quotes = quotes.filter((q) => q.philosopherId === req.query.philosopherId);
        }

        // Join philosophers and works by their string business ids.
        const [philById, workById] = await Promise.all([
            getByIds('philosopher', quotes.map((q) => q.philosopherId)),
            getByIds('work', quotes.map((q) => q.workId)),
        ]);

        const out = quotes.map((q) => {
            const p = philById.get(q.philosopherId);
            const w = q.workId ? workById.get(q.workId) : null;
            return {
                ...withFlatAliases('quote', q),
                _id: q.id, // legacy key compat (frontend uses _id for React keys / copy state)
                philosopher: p
                    ? withFlatAliases('philosopher', { id: p.id, name: p.name, imageUrl: p.imageUrl })
                    : null,
                work: w ? withFlatAliases('work', w) : null,
            };
        });
        res.json(out);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
