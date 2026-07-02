import colors from "colors";
import { listByType, putMany } from "../db/content.js";
import artworksData from "../data/artworks.js";

// Artworks need a stable string id for the table sort key; derive one from the
// title when the data file doesn't provide it.
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const seedArtworks = async () => {
    try {
        console.log("🎨 Seeding Artworks...".yellow);

        const allPhilosophers = await listByType("philosopher");

        const items = artworksData.map((art) => {
            const relatedPhilosopherIds = [];

            if (art.philosopher) {
                // Split by & or , and trim
                const names = art.philosopher.split(/&|,/).map(s => s.trim());

                for (const name of names) {
                    const p = allPhilosophers.find(ph => ph.name?.en === name);
                    if (p) {
                        relatedPhilosopherIds.push(p.id); // relation by string business key
                    } else {
                        console.log(`⚠️ Philosopher not found for artwork ${art.title}: ${name}`.red);
                    }
                }
            }

            return {
                ...art,
                entityType: "artwork",
                id: art.id || slugify(art.title),
                relatedPhilosopherIds,
            };
        });

        await putMany(items);
        console.log(`✅ ${items.length} Artworks seeded`.green);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedArtworks();
