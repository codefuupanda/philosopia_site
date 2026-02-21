import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import colors from 'colors';
import Philosopher from '../models/Philosopher.js';
import { getWikidataRelationships } from './universalEnricher.js';

dotenv.config();

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
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to MongoDB'.cyan.bold);

        const philosophers = await Philosopher.find({});
        console.log(`Found ${philosophers.length} philosophers to check...`.cyan);

        for (const p of philosophers) {
            await delay(1000); // Wait 1 second between philosophers
            const pName = p.name?.en || p.nameEn;
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

                // Update fields

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

                if (enrichedData.influencedBy && enrichedData.influencedBy.length > 0) p.influencedBy = enrichedData.influencedBy;
                if (enrichedData.students && enrichedData.students.length > 0) p.students = enrichedData.students;
                if (enrichedData.countryOfCitizenship && enrichedData.countryOfCitizenship.length > 0) p.countryOfCitizenship = enrichedData.countryOfCitizenship;
                if (enrichedData.foundationalTexts && enrichedData.foundationalTexts.length > 0) p.foundationalTexts = enrichedData.foundationalTexts;
                if (enrichedData.religion && enrichedData.religion.length > 0) p.religion = enrichedData.religion;

                p.lastEnriched = new Date();

                await p.save();
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
