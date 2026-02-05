import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import path from "path";
import { fileURLToPath } from "url";
import Philosopher from "../models/Philosopher.js";
import School from "../models/School.js";
import Period from "../models/Period.js";
import Concept from "../models/Concept.js";
import Beef from "../models/beef.js";
import Work from "../models/Work.js";
import Quote from "../models/Quote.js";

import periodsData from "../data/periods.js";
import schoolsData from "../data/schools.js";
import beefsData from "../data/beefs.js";
import conceptsData from "../data/concepts.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const philosophersData = require("../data/philosophers.json");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to MongoDB".cyan.bold);

    // 1. Seed Periods
    console.log("⏳ Seeding Periods...".yellow);
    for (const p of periodsData) {
      const update = {
        id: p.id,
        name: { en: p.nameEn, he: p.nameHe },
        description: { en: p.descriptionEn || "", he: p.descriptionHe || "" },
        startYear: p.startYear,
        endYear: p.endYear,

        // Deprecated fields (required by schema)
        nameEn: p.nameEn,
        nameHe: p.nameHe,
        descriptionEn: p.descriptionEn,
        descriptionHe: p.descriptionHe
      };

      await Period.findOneAndUpdate({ id: p.id }, update, { upsert: true, new: true });
    }
    console.log("✅ Periods seeded".green);

    // 2. Seed Schools
    console.log("🏫 Seeding Schools...".yellow);
    const allPeriods = await Period.find();
    for (const s of schoolsData) {
      const periodDoc = allPeriods.find(p => p.id === s.periodId);
      const update = {
        id: s.id,
        name: { en: s.nameEn, he: s.nameHe },
        description: { en: s.descriptionEn, he: s.descriptionHe },
        periodId: s.periodId,
        period: periodDoc ? periodDoc._id : null,

        // Deprecated fields
        nameEn: s.nameEn,
        nameHe: s.nameHe,
        descriptionEn: s.descriptionEn,
        descriptionHe: s.descriptionHe
      };
      await School.findOneAndUpdate({ id: s.id }, update, { upsert: true, new: true });
    }
    console.log("✅ Schools seeded".green);

    // 3. Seed Philosophers
    console.log("🧠 Seeding Philosophers...".yellow);
    const allSchools = await School.find();

    for (const p of philosophersData) {
      const schoolDoc = allSchools.find(s => s.id === p.schoolId);
      const periodDoc = allPeriods.find(per => per.id === p.periodId);

      const update = {
        id: p.id,
        name: { en: p.nameEn, he: p.nameHe },
        summary: { en: p.summaryEn, he: p.summaryHe },
        years: { en: p.yearsEn, he: p.yearsHe },
        keyIdeas: { en: p.keyIdeasEn || [], he: p.keyIdeasHe || [] },
        quotes: { en: p.quotesEn || [], he: p.quotesHe || [] },

        schoolId: p.schoolId,
        school: schoolDoc ? schoolDoc._id : null,
        periodId: p.periodId,
        period: periodDoc ? periodDoc._id : null,

        imageUrl: p.imageUrl,
        wikiQid: p.wikiQid,
        wikiTitle: p.wikiTitle,

        // Deprecated fields
        nameEn: p.nameEn,
        nameHe: p.nameHe,
        summaryEn: p.summaryEn,
        summaryHe: p.summaryHe,
        yearsEn: p.yearsEn,
        yearsHe: p.yearsHe,
        keyIdeasEn: p.keyIdeasEn,
        keyIdeasHe: p.keyIdeasHe,
        quotesEn: p.quotesEn,
        quotesHe: p.quotesHe
      };

      // Remove _id if present in source data to avoid immutable field error
      delete update._id;

      await Philosopher.findOneAndUpdate({ id: p.id }, update, { upsert: true, new: true });
    }
    console.log("✅ Philosophers seeded".green);

    // 4. Seed Beefs
    console.log("🥩 Seeding Beefs...".yellow);
    const allPhilosophers = await Philosopher.find();

    for (const b of beefsData) {
      const philA = allPhilosophers.find(p => p.id === b.philosopherA);
      const philB = allPhilosophers.find(p => p.id === b.philosopherB);

      if (philA && philB) {
        const update = {
          id: b.id,
          title: { en: b.titleEn, he: b.titleHe },
          description: { en: b.descriptionEn, he: b.descriptionHe },
          philosopherAId: b.philosopherA,
          philosopherBId: b.philosopherB,
          philosopherA: philA._id,
          philosopherB: philB._id,

          // Deprecated fields
          titleEn: b.titleEn,
          titleHe: b.titleHe,
          descriptionEn: b.descriptionEn,
          descriptionHe: b.descriptionHe
        };
        await Beef.findOneAndUpdate({ id: b.id }, update, { upsert: true, new: true });
      } else {
        console.log(`⚠️ Skipping beef ${b.id}: Philosophers not found`.red);
      }
    }
    console.log("✅ Beefs seeded".green);

    // 5. Seed Concepts
    console.log("💡 Seeding Concepts...".yellow);
    for (const c of conceptsData) {
      const relatedIds = [];
      if (c.relatedPhilosophers) {
        c.relatedPhilosophers.forEach(pid => {
          const p = allPhilosophers.find(ph => ph.id === pid);
          if (p) relatedIds.push(p._id);
        });
      }

      const update = {
        id: c.id,
        name: { en: c.nameEn, he: c.nameHe },
        summary: { en: c.summaryEn, he: c.summaryHe },
        description: { en: c.descriptionEn || "", he: c.descriptionHe || "" },
        relatedPhilosopherIds: c.relatedPhilosophers,
        relatedPhilosophers: relatedIds,

        // Deprecated fields
        nameEn: c.nameEn,
        nameHe: c.nameHe,
        summaryEn: c.summaryEn,
        summaryHe: c.summaryHe,
        descriptionEn: c.descriptionEn,
        descriptionHe: c.descriptionHe
      };
      await Concept.findOneAndUpdate({ id: c.id }, update, { upsert: true, new: true });
    }
    console.log("✅ Concepts seeded".green);

    console.log("🎉 Database Seeded Successfully!".green.bold.inverse);
    process.exit(0);

  } catch (err) {
    console.error("❌ Error seeding database:".red, err);
    process.exit(1);
  }
};

seed();
