const express = require("express");
const router = express.Router();
const Philosopher = require("../models/Philosopher");
const Concept = require("../models/Concept"); // ✅ Import Concept Model

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
    // 1. Find the Philosopher
    const philosopher = await Philosopher.findOne({ id: req.params.id });

    if (!philosopher) {
      return res.status(404).json({ error: "Philosopher not found" });
    }

    // 2. ✅ REVERSE LOOKUP: Find concepts that link TO this philosopher
    // We look for concepts where the 'relatedPhilosophers' array contains this philosopher's DB _id
    const linkedConcepts = await Concept.find({ relatedPhilosophers: philosopher._id })
      .select('id nameEn nameHe summaryEn summaryHe'); // Only get needed fields

    // 3. Return both
    res.json({ 
        philosopher,
        linkedConcepts // Send this new data to the frontend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;