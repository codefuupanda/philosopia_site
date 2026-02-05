import express from "express";
import Concept from "../models/Concept.js";

const router = express.Router();

// GET /api/concepts (All concepts)
router.get("/", async (req, res) => {
  try {
    const concepts = await Concept.find()
      .populate('relatedPhilosophers', 'id nameEn nameHe imageUrl');

    res.json({ concepts });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/concepts/:id (Specific concept)
router.get("/:id", async (req, res) => {
  try {
    const concept = await Concept.findOne({ id: req.params.id })
      .populate('relatedPhilosophers', 'id nameEn nameHe imageUrl summaryEn summaryHe');

    if (!concept) return res.status(404).json({ error: "Concept not found" });
    res.json({ concept });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
