import express from 'express';
import Period from '../models/Period.js';
import Philosopher from '../models/Philosopher.js';
import hiddenPeriods from '../config/hiddenPeriods.js';

const router = express.Router();

// GET /api/periods
router.get('/', async (req, res) => {
  try {
    const periods = await Period.aggregate([
      { $match: { nameEn: { $nin: hiddenPeriods } } },
      { $sort: { order: 1 } },
      {
        $lookup: {
          from: 'philosophers',
          localField: 'id',
          foreignField: 'periodId',
          as: 'philosophers'
        }
      },
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
                dates: "$$phil.yearsEn",
                yearsEn: "$$phil.yearsEn",
                yearsHe: "$$phil.yearsHe",
                imageUrl: "$$phil.imageUrl",
                bigIdeaEn: { $arrayElemAt: ["$$phil.keyIdeasEn", 0] },
                bigIdeaHe: { $arrayElemAt: ["$$phil.keyIdeasHe", 0] },
                quote: { $arrayElemAt: ["$$phil.quotesEn", 0] },
                tags: "$$phil.keyIdeasEn",
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

export default router;
