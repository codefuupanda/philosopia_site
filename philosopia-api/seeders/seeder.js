import colors from "colors";
import { putMany } from "../db/content.js";

import periodsData from "../data/periods.js";
import schoolsData from "../data/schools.js";
import beefsData from "../data/beefs.js";
import conceptsData from "../data/concepts.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const philosophersData = require("../data/philosophers.json");

// Transforms the flat data files into the canonical nested { en, he } shape and
// batch-writes to the DynamoDB content table. Put overwrites by (entityType, id),
// so re-running is idempotent (same semantics as the old upserts).

const seed = async () => {
  try {
    // 1. Seed Periods
    console.log("⏳ Seeding Periods...".yellow);
    await putMany(periodsData.map((p) => ({
      entityType: "period",
      id: p.id,
      name: { en: p.nameEn, he: p.nameHe },
      description: { en: p.descriptionEn || "", he: p.descriptionHe || "" },
      startYear: p.startYear,
      endYear: p.endYear,
    })));
    console.log(`✅ ${periodsData.length} Periods seeded`.green);

    // 2. Seed Schools (relations by string id)
    console.log("🏫 Seeding Schools...".yellow);
    await putMany(schoolsData.map((s) => ({
      entityType: "school",
      id: s.id,
      name: { en: s.nameEn, he: s.nameHe },
      description: { en: s.descriptionEn, he: s.descriptionHe },
      periodId: s.periodId,
    })));
    console.log(`✅ ${schoolsData.length} Schools seeded`.green);

    // 3. Seed Philosophers (relations by string id; Wikidata relations come
    //    straight from philosophers.json, which already carries enriched data)
    console.log("🧠 Seeding Philosophers...".yellow);
    await putMany(philosophersData.map((p) => ({
      entityType: "philosopher",
      id: p.id,
      name: { en: p.nameEn, he: p.nameHe },
      summary: { en: p.summaryEn, he: p.summaryHe },
      years: { en: p.yearsEn, he: p.yearsHe },
      keyIdeas: { en: p.keyIdeasEn || [], he: p.keyIdeasHe || [] },
      quotes: { en: p.quotesEn || [], he: p.quotesHe || [] },
      schoolId: p.schoolId,
      periodId: p.periodId,
      imageUrl: p.imageUrl,
      wikiQid: p.wikiQid,
      wikiTitle: p.wikiTitle,
      countryOfCitizenship: p.countryOfCitizenship || [],
      influencedBy: p.influencedBy || [],
      students: p.students || [],
      foundationalTexts: p.foundationalTexts || [],
      religion: p.religion || [],
    })));
    console.log(`✅ ${philosophersData.length} Philosophers seeded`.green);

    // 4. Seed Beefs (validate that both philosophers exist by string id)
    console.log("🥩 Seeding Beefs...".yellow);
    const validPhilosopherIds = new Set(philosophersData.map((p) => p.id));
    const validBeefs = [];
    for (const b of beefsData) {
      if (validPhilosopherIds.has(b.philosopherA) && validPhilosopherIds.has(b.philosopherB)) {
        validBeefs.push({
          entityType: "beef",
          id: b.id,
          title: { en: b.titleEn, he: b.titleHe },
          description: { en: b.descriptionEn, he: b.descriptionHe },
          philosopherAId: b.philosopherA,
          philosopherBId: b.philosopherB,
        });
      } else {
        console.log(`⚠️ Skipping beef ${b.id}: Philosophers not found`.red);
      }
    }
    await putMany(validBeefs);
    console.log(`✅ ${validBeefs.length} Beefs seeded`.green);

    // 5. Seed Concepts (relations by string id)
    console.log("💡 Seeding Concepts...".yellow);
    await putMany(conceptsData.map((c) => ({
      entityType: "concept",
      id: c.id,
      name: { en: c.nameEn, he: c.nameHe },
      summary: { en: c.summaryEn, he: c.summaryHe },
      description: { en: c.descriptionEn || "", he: c.descriptionHe || "" },
      relatedPhilosopherIds: (c.relatedPhilosophers || []).filter((pid) => validPhilosopherIds.has(pid)),
    })));
    console.log(`✅ ${conceptsData.length} Concepts seeded`.green);

    console.log("🎉 Database Seeded Successfully!".green.bold.inverse);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:".red, err);
    process.exit(1);
  }
};

seed();
