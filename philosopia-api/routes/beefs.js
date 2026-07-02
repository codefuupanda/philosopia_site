import express from "express";
import { listByType, getById, getByIds, put, deleteById } from "../db/content.js";
import { withFlatAliases } from "../db/aliases.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Attach philosopherA / philosopherB objects to beefs by joining on string ids.
async function attachPhilosophers(beefs) {
  const ids = beefs.flatMap((b) => [b.philosopherAId, b.philosopherBId]).filter(Boolean);
  const byId = await getByIds("philosopher", ids);
  const pick = (id) => {
    const p = byId.get(id);
    return p
      ? withFlatAliases("philosopher", { id: p.id, name: p.name, imageUrl: p.imageUrl })
      : null;
  };
  return beefs.map((b) => ({
    ...withFlatAliases("beef", b),
    philosopherA: pick(b.philosopherAId),
    philosopherB: pick(b.philosopherBId),
  }));
}

// GET /api/beefs (Get all beefs with philosopher data)
router.get("/", async (req, res) => {
  try {
    const beefs = await listByType("beef");
    res.json({ beefs: await attachPhilosophers(beefs) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/beefs/:id (Get specific beef)
router.get("/:id", async (req, res) => {
  try {
    const beef = await getById("beef", req.params.id);
    if (!beef) return res.status(404).json({ error: "Beef not found" });
    const [withPhils] = await attachPhilosophers([beef]);
    res.json({ beef: withPhils });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// POST /api/beefs (Create new beef) - PROTECTED
// Accepts either nested { title, description } or legacy flat titleEn/titleHe,
// and philosopher references as string business ids (philosopherAId or philosopherA).
router.post("/", protect, async (req, res) => {
  try {
    const b = req.body;

    const beef = {
      entityType: "beef",
      id: b.id,
      title: b.title || { en: b.titleEn, he: b.titleHe },
      description: b.description || { en: b.descriptionEn, he: b.descriptionHe },
      philosopherAId: b.philosopherAId || b.philosopherA,
      philosopherBId: b.philosopherBId || b.philosopherB,
    };

    if (!beef.id || !beef.title?.en || !beef.title?.he || !beef.philosopherAId || !beef.philosopherBId) {
      return res.status(400).json({ error: "Invalid data" });
    }

    await put(beef);
    res.status(201).json(withFlatAliases("beef", beef));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid data" });
  }
});

// DELETE /api/beefs/:id (Delete beef) - PROTECTED
router.delete("/:id", protect, async (req, res) => {
  try {
    const old = await deleteById("beef", req.params.id);
    if (!old) return res.status(404).json({ error: "Beef not found" });
    res.json({ message: "Beef removed" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
