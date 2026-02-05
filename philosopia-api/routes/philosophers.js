import express from "express";
import Philosopher from "../models/Philosopher.js";
import Concept from "../models/Concept.js";

const router = express.Router();

// GET /api/philosophers (List)
router.get("/", async (req, res) => {
  try {
    const { ids, periodId } = req.query;
    let query = {};

    if (ids) {
      const idList = ids.split(",");
      query.id = { $in: idList };
    }

    if (periodId) {
      query.periodId = periodId;
    }

    const philosophers = await Philosopher.find(query);
    res.json({ philosophers, total: philosophers.length });

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
