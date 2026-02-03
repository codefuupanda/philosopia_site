const express = require('express');
const router = express.Router();
const Period = require('../models/Period');
const Philosopher = require('../models/Philosopher');
const hiddenPeriods = require('../config/hiddenPeriods');

// GET /api/periods
// Returns periods with their associated philosophers nested inside
router.get('/', async (req, res) => {
  try {
    const periods = await Period.aggregate([
      // 0. Filter out hidden periods
      { $match: { nameEn: { $nin: hiddenPeriods } } },

      // 1. Sort by chronological order
      { $sort: { order: 1 } },

      // 2. Join with Philosophers
      {
        $lookup: {
          from: 'philosophers',       // Collection name in MongoDB
          localField: 'id',           // Field in Period (e.g., "ancient")
          foreignField: 'periodId',   // Field in Philosopher linking to period
          as: 'philosophers'          // Result array name
        }
      },

      // 3. Project and Transform
      {
        $project: {
          id: 1,
          nameEn: 1,
          nameHe: 1,
          startYear: 1,
          endYear: 1,
          dates: 1,
          descriptionEn: 1,
          descriptionHe: 1,
          philosophers: {
            $map: {
              input: "$philosophers",
              as: "phil",
              in: {
                id: "$$phil.id",
                nameEn: "$$phil.nameEn",
                nameHe: "$$phil.nameHe",
                // Map years to 'dates' for frontend compatibility
                dates: "$$phil.yearsEn",
                yearsEn: "$$phil.yearsEn",
                yearsHe: "$$phil.yearsHe",
                imageUrl: "$$phil.imageUrl",
                // Map first key idea to bigIdea
                bigIdeaEn: { $arrayElemAt: ["$$phil.keyIdeasEn", 0] },
                bigIdeaHe: { $arrayElemAt: ["$$phil.keyIdeasHe", 0] },
                // Map first quote to quote
                quote: { $arrayElemAt: ["$$phil.quotesEn", 0] },
                // Map keyIdeas to tags
                tags: "$$phil.keyIdeasEn",
                // Include summaries for fallback display
                summaryEn: "$$phil.summaryEn",
                summaryHe: "$$phil.summaryHe",
                schoolId: "$$phil.schoolId"
              }
            }
          }
        }
      }
    ]);

    res.json({ periods });
  } catch (err) {
    console.error("Error fetching timeline:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/periods/:id
router.get('/:id', async (req, res) => {
  try {
    const period = await Period.findOne({ id: req.params.id });
    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }
    res.json({ period });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;