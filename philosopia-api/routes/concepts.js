import express from "express";
import { listByType, getById, getByIds } from "../db/content.js";
import { withFlatAliases } from "../db/aliases.js";

const router = express.Router();

// Attach relatedPhilosophers objects to concepts by joining on string ids.
async function attachPhilosophers(concepts, { includeSummary = false } = {}) {
  const ids = concepts.flatMap((c) => c.relatedPhilosopherIds || []);
  const byId = await getByIds("philosopher", ids);
  return concepts.map((c) => ({
    ...withFlatAliases("concept", c),
    relatedPhilosophers: (c.relatedPhilosopherIds || [])
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => withFlatAliases("philosopher", {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        ...(includeSummary ? { summary: p.summary } : {}),
      })),
  }));
}

// GET /api/concepts (All concepts)
router.get("/", async (req, res) => {
  try {
    const concepts = await listByType("concept");
    res.json({ concepts: await attachPhilosophers(concepts) });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/concepts/:id (Specific concept)
router.get("/:id", async (req, res) => {
  try {
    const concept = await getById("concept", req.params.id);
    if (!concept) return res.status(404).json({ error: "Concept not found" });
    const [withPhils] = await attachPhilosophers([concept], { includeSummary: true });
    res.json({ concept: withPhils });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
