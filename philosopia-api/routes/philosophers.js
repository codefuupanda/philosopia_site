import express from "express";
import Philosopher from "../models/Philosopher.js";
import Concept from "../models/Concept.js";

const router = express.Router();

// GET /api/philosophers (List with pagination)
router.get("/", async (req, res) => {
  try {
    const { ids, periodId, page, limit: limitParam } = req.query;
    let query = {};

    if (ids) {
      const idList = ids.split(",");
      query.id = { $in: idList };
    }

    if (periodId) {
      query.periodId = periodId;
    }

    // If no pagination params, return all (backward compatible)
    if (!page && !limitParam) {
      const philosophers = await Philosopher.find(query).sort({ nameEn: 1 });
      return res.json({ philosophers, total: philosophers.length });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limitParam) || 12));
    const skip = (pageNum - 1) * limit;

    const [philosophers, total] = await Promise.all([
      Philosopher.find(query).sort({ nameEn: 1 }).skip(skip).limit(limit),
      Philosopher.countDocuments(query),
    ]);

    res.json({
      philosophers,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/philosophers/:id (Detail + Linked Concepts)
router.get("/:id", async (req, res) => {
  try {
    const philosopher = await Philosopher.findOne({ id: req.params.id });

    if (!philosopher) {
      return res.status(404).json({ error: "Philosopher not found" });
    }

    const linkedConcepts = await Concept.find({ relatedPhilosophers: philosopher._id })
      .select('id nameEn nameHe summaryEn summaryHe');

    res.json({
        philosopher,
        linkedConcepts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
