import express from "express";
import { listByType, getById } from "../db/content.js";
import { withFlatAliases, withFlatAliasesList } from "../db/aliases.js";
import { withResolvedRelations, buildNetwork } from "../db/philosopherGraph.js";

const router = express.Router();

// GET /api/philosophers (List with pagination)
router.get("/", async (req, res) => {
  try {
    const { ids, periodId, page, limit: limitParam } = req.query;

    let philosophers = await listByType("philosopher");

    if (ids) {
      const idSet = new Set(ids.split(","));
      philosophers = philosophers.filter((p) => idSet.has(p.id));
    }

    if (periodId) {
      philosophers = philosophers.filter((p) => p.periodId === periodId);
    }

    philosophers.sort((a, b) => (a.name?.en || "").localeCompare(b.name?.en || ""));
    philosophers = withFlatAliasesList("philosopher", philosophers);

    // If no pagination params, return all (backward compatible)
    if (!page && !limitParam) {
      return res.json({ philosophers, total: philosophers.length });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limitParam) || 12));
    const total = philosophers.length;
    const start = (pageNum - 1) * limit;

    res.json({
      philosophers: philosophers.slice(start, start + limit),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/philosophers/graph/network — whole-catalog nodes/links for the
// relation graph viz. MUST stay registered before "/:id" (which would
// otherwise swallow "graph" as a philosopher id).
router.get("/graph/network", async (req, res) => {
  try {
    const network = await buildNetwork();
    res.json(network);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/philosophers/:id (Detail + Linked Concepts)
router.get("/:id", async (req, res) => {
  try {
    const philosopher = await getById("philosopher", req.params.id);

    if (!philosopher) {
      return res.status(404).json({ error: "Philosopher not found" });
    }

    // Resolve relation QIDs to internal ids + synthesize inferred reverse edges
    const resolved = await withResolvedRelations(philosopher);

    // Concepts link back to philosophers by string business id
    const concepts = await listByType("concept");
    const linkedConcepts = concepts
      .filter((c) => (c.relatedPhilosopherIds || []).includes(philosopher.id))
      .map((c) => withFlatAliases("concept", { id: c.id, name: c.name, summary: c.summary }));

    res.json({
      philosopher: withFlatAliases("philosopher", resolved),
      linkedConcepts,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
