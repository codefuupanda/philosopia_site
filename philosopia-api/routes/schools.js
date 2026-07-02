import express from 'express';
import { listByType } from '../db/content.js';

const router = express.Router();

// Shape a school + its member philosophers (same keys the old $project emitted).
function schoolPayload(school, philosophers) {
  return {
    id: school.id,
    nameEn: school.name?.en,
    nameHe: school.name?.he,
    descriptionEn: school.description?.en,
    descriptionHe: school.description?.he,
    yearsEn: school.years?.en,
    yearsHe: school.years?.he,
    locationEn: school.location?.en,
    locationHe: school.location?.he,
    famousQuoteEn: school.famousQuote?.en,
    famousQuoteHe: school.famousQuote?.he,
    philosophers: philosophers.map((p) => ({
      id: p.id,
      nameEn: p.name?.en,
      nameHe: p.name?.he,
      imageUrl: p.imageUrl,
    })),
  };
}

// GET /api/schools - Get all schools
router.get('/', async (req, res) => {
  try {
    const [allSchools, allPhilosophers] = await Promise.all([
      listByType('school'),
      listByType('philosopher'),
    ]);

    const bySchool = {};
    for (const phil of allPhilosophers) {
      (bySchool[phil.schoolId] ||= []).push(phil);
    }

    const schools = allSchools.map((s) => schoolPayload(s, bySchool[s.id] || []));
    res.json({ schools });
  } catch (err) {
    console.error("Error fetching schools:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/schools/:id - Get specific school
router.get('/:id', async (req, res) => {
  try {
    const [allSchools, allPhilosophers] = await Promise.all([
      listByType('school'),
      listByType('philosopher'),
    ]);

    const school = allSchools.find((s) => s.id === req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const members = allPhilosophers.filter((p) => p.schoolId === school.id);
    res.json({ school: schoolPayload(school, members) });

  } catch (err) {
    console.error("Error fetching school details:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
