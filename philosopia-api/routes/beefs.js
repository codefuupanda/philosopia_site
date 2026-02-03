const express = require("express");
const router = express.Router();
const Beef = require("../models/beef");
const Philosopher = require("../models/Philosopher");
const { protect } = require("../middleware/authMiddleware");

// GET /api/beefs (Get all beefs with philosopher data)
router.get("/", async (req, res) => {
  try {
    const beefs = await Beef.find()
      .populate('philosopherA', 'id nameEn nameHe imageUrl')
      .populate('philosopherB', 'id nameEn nameHe imageUrl');

    res.json({ beefs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/beefs/:id (Get specific beef)
router.get("/:id", async (req, res) => {
  try {
    const beef = await Beef.findOne({ id: req.params.id })
      .populate('philosopherA', 'id nameEn nameHe imageUrl')
      .populate('philosopherB', 'id nameEn nameHe imageUrl');

    if (!beef) return res.status(404).json({ error: "Beef not found" });
    res.json({ beef });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// POST /api/beefs (Create new beef) - PROTECTED
router.post("/", protect, async (req, res) => {
  try {
    const { id, titleEn, titleHe, descriptionEn, descriptionHe, philosopherA, philosopherB } = req.body;

    const beef = await Beef.create({
      id,
      titleEn,
      titleHe,
      descriptionEn,
      descriptionHe,
      philosopherA,
      philosopherB
    });

    res.status(201).json(beef);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid data" });
  }
});

// DELETE /api/beefs/:id (Delete beef) - PROTECTED
router.delete("/:id", protect, async (req, res) => {
  try {
    const beef = await Beef.findOneAndDelete({ id: req.params.id });
    if (!beef) return res.status(404).json({ error: "Beef not found" });
    res.json({ message: "Beef removed" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;