/**
 * In-memory philosopher relation graph — QID → internal-slug resolution and
 * reverse-edge synthesis. No graph DB: the whole catalog is ~66 records, so we
 * hold it in memory and rebuild every REFRESH_MS (matches the route cache TTL,
 * and picks up re-seeds without a server restart).
 *
 * Wikidata relations (`influencedBy`, `students`) are stored as
 * { qid, labelEn, labelHe }. This module decorates them:
 *   - `philosopherId`: set when the QID belongs to one of our own philosophers
 *     (the frontend renders those as links instead of inert chips).
 *   - synthesized reverse edges, marked `inferred: true`:
 *       X.students includes me     → X joins my `influencedBy` (X taught me)
 *       X.influencedBy includes me → X joins my `students` (X follows me)
 */
import { listByType } from './content.js';

const REFRESH_MS = 5 * 60 * 1000;

let cache = null; // { byQid: Map<qid, philosopher>, philosophers, builtAt }
let building = null; // in-flight build promise, so concurrent requests share one scan

async function load() {
  if (cache && Date.now() - cache.builtAt < REFRESH_MS) return cache;
  if (!building) {
    building = (async () => {
      const philosophers = await listByType('philosopher');
      const byQid = new Map();
      for (const p of philosophers) {
        if (p.wikiQid) byQid.set(p.wikiQid, p);
      }
      cache = { byQid, philosophers, builtAt: Date.now() };
      building = null;
      return cache;
    })().catch((err) => {
      building = null; // don't poison future requests with a failed build
      throw err;
    });
  }
  return building;
}

/**
 * Build the whole-catalog network for the graph visualization.
 *
 * Nodes: one per philosopher (bilingual names + periodId/schoolId for coloring).
 * Links: directed influence edges `source → target` (source influenced target),
 * deduped across the two Wikidata properties:
 *   - target's `influencedBy` names source (P737, the canonical claim) → inferred: false
 *   - only source's `students` names target (P802, no P737 back-claim) → inferred: true
 * This matches the profile pages: an edge is `inferred` exactly when the
 * target's own profile shows that teacher as a dashed (synthesized) chip.
 */
export async function buildNetwork() {
  const { byQid, philosophers } = await load();

  const nodes = philosophers.map((p) => ({
    id: p.id,
    nameEn: p.name?.en,
    nameHe: p.name?.he || p.name?.en,
    periodId: p.periodId || null,
    schoolId: p.schoolId || null,
    yearsEn: p.years?.en || '',
    yearsHe: p.years?.he || p.years?.en || '',
  }));

  const links = new Map(); // "source->target" -> link

  // Pass 1: canonical P737 claims (student states their influences)
  for (const p of philosophers) {
    for (const rel of p.influencedBy || []) {
      const match = rel.qid && byQid.get(rel.qid);
      if (match && match.id !== p.id) {
        links.set(`${match.id}->${p.id}`, { source: match.id, target: p.id, inferred: false });
      }
    }
  }

  // Pass 2: P802 claims (teacher lists students); only new edges are "inferred"
  for (const p of philosophers) {
    for (const rel of p.students || []) {
      const match = rel.qid && byQid.get(rel.qid);
      if (match && match.id !== p.id) {
        const key = `${p.id}->${match.id}`;
        if (!links.has(key)) {
          links.set(key, { source: p.id, target: match.id, inferred: true });
        }
      }
    }
  }

  return { nodes, links: [...links.values()] };
}

/**
 * Return a copy of the philosopher with `influencedBy`/`students` resolved to
 * internal ids where possible and augmented with inferred reverse edges.
 */
export async function withResolvedRelations(philosopher) {
  const { byQid, philosophers } = await load();

  const resolve = (items = []) =>
    items.map((item) => {
      const match = item.qid && byQid.get(item.qid);
      return match && match.id !== philosopher.id
        ? { ...item, philosopherId: match.id }
        : { ...item };
    });

  const influencedBy = resolve(philosopher.influencedBy);
  const students = resolve(philosopher.students);

  if (philosopher.wikiQid) {
    const teacherQids = new Set(influencedBy.map((i) => i.qid));
    const studentQids = new Set(students.map((i) => i.qid));

    const inferredEntry = (p) => ({
      qid: p.wikiQid,
      labelEn: p.name?.en,
      labelHe: p.name?.he || p.name?.en,
      philosopherId: p.id,
      inferred: true,
    });

    for (const other of philosophers) {
      if (other.id === philosopher.id || !other.wikiQid) continue;

      if (
        (other.students || []).some((s) => s.qid === philosopher.wikiQid) &&
        !teacherQids.has(other.wikiQid)
      ) {
        influencedBy.push(inferredEntry(other));
        teacherQids.add(other.wikiQid);
      }

      if (
        (other.influencedBy || []).some((s) => s.qid === philosopher.wikiQid) &&
        !studentQids.has(other.wikiQid)
      ) {
        students.push(inferredEntry(other));
        studentQids.add(other.wikiQid);
      }
    }
  }

  return { ...philosopher, influencedBy, students };
}
