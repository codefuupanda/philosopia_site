import colors from 'colors';
import { getById, put } from '../db/content.js';
import { getWikidataRelationships } from '../seeders/universalEnricher.js';

// Targeted enrichment: same per-item logic as seeders/enrichAllPhilosophers.js,
// but only for the ids passed on the command line. Use after adding a new
// philosopher so you don't have to re-run the full (slow) enrichment sweep.
//
//   node scripts/enrichPhilosophers.js thomas_aquinas edmund_husserl

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ids = process.argv.slice(2);
if (ids.length === 0) {
    console.error('Usage: node scripts/enrichPhilosophers.js <philosopherId> [...more ids]'.red);
    process.exit(1);
}

for (const id of ids) {
    const p = await getById('philosopher', id);
    if (!p) {
        console.error(`❌ '${id}' not found in the content table — seed it first.`.red);
        process.exitCode = 1;
        continue;
    }
    const pName = p.name?.en || id;
    console.log(`\nProcessing ${pName}...`.yellow);
    if (!p.wikiQid) {
        console.error(`  - ❌ No wikiQid on the item; cannot enrich. Set wikiQid and re-seed.`.red);
        process.exitCode = 1;
        continue;
    }
    try {
        const enrichedData = await getWikidataRelationships(p.wikiQid, p.wikiTitle || pName);

        if (enrichedData.imageUrl) {
            p.enrichedImageUrl = enrichedData.imageUrl;
            if (!p.manualImageUrl) p.imageUrl = enrichedData.imageUrl;
        }
        if (enrichedData.bioHtml) p.bioHtml = enrichedData.bioHtml;
        if (enrichedData.bioHtmlHe) {
            if (!p.wikiData) p.wikiData = {};
            p.wikiData.bioHe = enrichedData.bioHtmlHe;
        }
        if (enrichedData.influencedBy?.length > 0) p.influencedBy = enrichedData.influencedBy;
        if (enrichedData.students?.length > 0) p.students = enrichedData.students;
        if (enrichedData.countryOfCitizenship?.length > 0) p.countryOfCitizenship = enrichedData.countryOfCitizenship;
        if (enrichedData.foundationalTexts?.length > 0) p.foundationalTexts = enrichedData.foundationalTexts;
        if (enrichedData.religion?.length > 0) p.religion = enrichedData.religion;

        p.lastEnriched = new Date().toISOString();
        await put(p);
        console.log(`  - ✅ Enriched and saved (image: ${p.imageUrl ? 'yes' : 'no'}, bio: ${p.bioHtml ? 'yes' : 'no'}, bioHe: ${p.wikiData?.bioHe ? 'yes' : 'no'})`.green);
    } catch (err) {
        console.error(`  - ❌ Error enriching ${pName}:`.red, err.message);
        process.exitCode = 1;
    }
    await delay(1000); // be polite to the Wikipedia/Wikidata APIs
}

console.log('\nDone.'.green.bold);
