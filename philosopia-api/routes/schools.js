const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Philosopher = require('../models/Philosopher');

// GET /api/schools - Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await School.aggregate([
      {
        $lookup: {
          from: 'philosophers',
          localField: 'id',
          foreignField: 'schoolId',
          as: 'philosophers'
        }
      },
      {
        $project: {
          id: 1,
          nameEn: 1,
          nameHe: 1,
          descriptionEn: 1,
          descriptionHe: 1,
          yearsEn: 1,
          yearsHe: 1,
          locationEn: 1,
          locationHe: 1,
          famousQuoteEn: 1,
          famousQuoteHe: 1,
          philosophers: { id: 1, nameEn: 1, nameHe: 1, imageUrl: 1 }
        }
      }
    ]);
    res.json({ schools });
  } catch (err) {
    console.error("Error fetching schools:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/schools/:id - Get specific school
router.get('/:id', async (req, res) => {
  try {
    const schoolId = req.params.id;

    const result = await School.aggregate([
      {
        $match: { id: schoolId }
      },
      {
        $lookup: {
          from: 'philosophers',
          localField: 'id',
          foreignField: 'schoolId',
          as: 'philosophers'
        }
      },
      {
        $project: {
          id: 1,
          nameEn: 1,
          nameHe: 1,
          descriptionEn: 1,
          descriptionHe: 1,
          yearsEn: 1,
          yearsHe: 1,
          locationEn: 1,
          locationHe: 1,
          famousQuoteEn: 1,
          famousQuoteHe: 1,
          philosophers: { id: 1, nameEn: 1, nameHe: 1, imageUrl: 1 }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({ school: result[0] });

  } catch (err) {
    console.error("Error fetching school details:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;