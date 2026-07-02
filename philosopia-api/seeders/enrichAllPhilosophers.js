import axios from 'axios';
import colors from 'colors';
import { listByType, put } from '../db/content.js';
import { getWikidataRelationships } from './universalEnricher.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getQidFromTitle = async (title) => {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(title)}&format=json`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'PhilosopiaProject/1.0 (learning_project)' }
        });
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === '-1') return null;
        return pages[pageId].pageprops?.wikibase_item || null;
    } catch (error) {
        console.error(`Error fetching QID for ${title}:`, error.message);
        return null;
    }
};

const enrichAll = async () => {
    try {
        const philosophers = await listByType('philosopher');
        console.log(`Found ${philosophers.length} philosophers to check...`.cyan);

        for (const p of philosophers) {
            await delay(1000); // Wait 1 second between philosophers
            const pName = p.name?.en;
            console.log(`\nProcessing ${pName}...`.yellow);

            // 1. Ensure we have a QID
            if (!p.wikiQid) {
                const searchTitle = p.wikiTitle || pName;
                console.log(`  - Missing QID. Fetching for title: ${searchTitle}...`);
                const qid = await getQidFromTitle(searchTitle);
                if (qid) {
                    p.wikiQid = qid;
                    console.log(`  - Found QID: ${qid}`.green);
                } else {
                    console.log(`  - Could not find QID. Skipping enrichment.`.red);
                    continue;
                }
            }

            // 2. Enrich using universalEnricher
            console.log(`  - Fetching detailed data from Wikidata/Wikipedia...`);
            try {
                const enrichedData = await getWikidataRelationships(p.wikiQid, p.wikiTitle || pName);

                // Images: Separate manual from enriched
                if (enrichedData.imageUrl) {
                    p.enrichedImageUrl = enrichedData.imageUrl;
                    if (!p.manualImageUrl) {
                        p.imageUrl = enrichedData.imageUrl; // Fallback
                    }
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

                await put(p); // full-item overwrite of the same (entityType, id)
                console.log(`  - ✅ Successfully enriched and saved.`.green);

            } catch (err) {
                console.error(`  - ❌ Error enriching ${pName}:`.red, err.message);
            }
        }

        console.log('\n🎉 All philosophers processed!'.green.bold);
        process.exit(0);

    } catch (error) {
        console.error('❌ Script failed:'.red, error);
        process.exit(1);
    }
};

enrichAll();
