import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import Philosopher from "../models/Philosopher.js";
import Beef from "../models/beef.js";
import Concept from "../models/Concept.js";

const require = createRequire(import.meta.url);
const philosophersData = require("../data/philosophers.json");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

if (process.env.USE_CUSTOM_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const validIds = new Set(philosophersData.map(p => p.id));

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find all philosophers NOT in the seed data
    const allPhilosophers = await Philosopher.find();
    const duplicates = allPhilosophers.filter(p => !validIds.has(p.id));

    if (duplicates.length === 0) {
      console.log("No duplicates found. Database is clean.");
      process.exit(0);
    }

    console.log(`\nFound ${duplicates.length} duplicate(s) to remove:`);
    duplicates.forEach(d => console.log(`  - id: "${d.id}" | name: "${d.nameEn}"`));

    // 2. Delete duplicates
    const duplicateIds = duplicates.map(d => d.id);
    const result = await Philosopher.deleteMany({ id: { $in: duplicateIds } });
    console.log(`\nDeleted ${result.deletedCount} duplicate philosopher(s).`);

    // 3. Re-link beefs to correct philosopher _ids
    console.log("\nRe-linking beefs...");
    const beefs = await Beef.find();
    const validPhilosophers = await Philosopher.find();

    for (const beef of beefs) {
      const philA = validPhilosophers.find(p => p.id === beef.philosopherAId);
      const philB = validPhilosophers.find(p => p.id === beef.philosopherBId);

      if (philA && philB) {
        await Beef.findOneAndUpdate({ id: beef.id }, {
          philosopherA: philA._id,
          philosopherB: philB._id
        });
        console.log(`  Fixed beef: ${beef.id}`);
      } else {
        console.log(`  Warning: beef "${beef.id}" has missing philosopher reference`);
      }
    }

    // 4. Re-link concepts to correct philosopher _ids
    console.log("\nRe-linking concepts...");
    const concepts = await Concept.find();

    for (const concept of concepts) {
      if (concept.relatedPhilosopherIds && concept.relatedPhilosopherIds.length > 0) {
        const newRefs = [];
        for (const pid of concept.relatedPhilosopherIds) {
          const phil = validPhilosophers.find(p => p.id === pid);
          if (phil) newRefs.push(phil._id);
        }
        await Concept.findOneAndUpdate({ id: concept.id }, {
          relatedPhilosophers: newRefs
        });
      }
    }
    console.log("Concepts re-linked.");

    console.log("\nCleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanup();
