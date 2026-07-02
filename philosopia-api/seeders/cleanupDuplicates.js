import { createRequire } from "module";
import { listByType, deleteById } from "../db/content.js";

const require = createRequire(import.meta.url);
const philosophersData = require("../data/philosophers.json");

const validIds = new Set(philosophersData.map(p => p.id));

async function cleanup() {
  try {
    // Find all philosophers NOT in the seed data
    const allPhilosophers = await listByType("philosopher");
    const duplicates = allPhilosophers.filter(p => !validIds.has(p.id));

    if (duplicates.length === 0) {
      console.log("No duplicates found. Database is clean.");
      process.exit(0);
    }

    console.log(`\nFound ${duplicates.length} duplicate(s) to remove:`);
    duplicates.forEach(d => console.log(`  - id: "${d.id}" | name: "${d.name?.en}"`));

    for (const d of duplicates) {
      await deleteById("philosopher", d.id);
    }
    console.log(`\nDeleted ${duplicates.length} duplicate philosopher(s).`);

    // Note: relations (beefs, concepts, works, quotes, artworks) reference philosophers
    // by their stable string id, so no re-linking is needed after deletion.

    console.log("\nCleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanup();
