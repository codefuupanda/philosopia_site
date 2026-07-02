import express from 'express';
import { listByType, getById } from '../db/content.js';
import { withFlatAliases } from '../db/aliases.js';
import hiddenPeriods from '../config/hiddenPeriods.js';

const router = express.Router();

// Shape a philosopher for the timeline payload (same keys the old $project emitted).
function timelinePhilosopher(phil) {
  return {
    id: phil.id,
    nameEn: phil.name?.en,
    nameHe: phil.name?.he,
    dates: phil.years?.en,
    yearsEn: phil.years?.en,
    yearsHe: phil.years?.he,
    imageUrl: phil.imageUrl,
    bigIdeaEn: phil.keyIdeas?.en?.[0],
    bigIdeaHe: phil.keyIdeas?.he?.[0],
    quote: phil.quotes?.en?.[0],
    tags: phil.keyIdeas?.en,
    summaryEn: phil.summary?.en,
    summaryHe: phil.summary?.he,
    schoolId: phil.schoolId,
  };
}

// GET /api/periods
router.get('/', async (req, res) => {
  try {
    const [allPeriods, allPhilosophers] = await Promise.all([
      listByType('period'),
      listByType('philosopher'),
    ]);

    const byPeriod = {};
    for (const phil of allPhilosophers) {
      (byPeriod[phil.periodId] ||= []).push(timelinePhilosopher(phil));
    }

    const periods = allPeriods
      .filter((p) => !hiddenPeriods.includes(p.name?.en))
      .sort((a, b) => a.startYear - b.startYear)
      .map((p) => ({
        id: p.id,
        nameEn: p.name?.en,
        nameHe: p.name?.he,
        startYear: p.startYear,
        endYear: p.endYear,
        descriptionEn: p.description?.en,
        descriptionHe: p.description?.he,
        philosophers: byPeriod[p.id] || [],
      }));

    res.json({ periods });
  } catch (err) {
    console.error("Error fetching timeline:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/periods/:id
router.get('/:id', async (req, res) => {
  try {
    const period = await getById('period', req.params.id);
    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }
    res.json({ period: withFlatAliases('period', period) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
