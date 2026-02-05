import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import Artwork from "../models/Artwork.js";
import Philosopher from "../models/Philosopher.js";
import artworksData from "../data/artworks.js";

dotenv.config();

const seedArtworks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🎨 Seeding Artworks...".yellow);

        const allPhilosophers = await Philosopher.find();

        for (const art of artworksData) {
            const relatedIds = [];

            if (art.philosopher) {
                // Split by & or , and trim
                const names = art.philosopher.split(/&|,/).map(s => s.trim());

                for (const name of names) {
                    const p = allPhilosophers.find(ph => ph.nameEn === name || (ph.name && ph.name.en === name));
                    if (p) {
                        relatedIds.push(p._id);
                    } else {
                        console.log(`⚠️ Philosopher not found for artwork ${art.title}: ${name}`.red);
                    }
                }
            }

            const update = {
                ...art,
                relatedPhilosophers: relatedIds,
                relatedPhilosopherIds: relatedIds.map(oid => {
                    const p = allPhilosophers.find(ph => ph._id.toString() === oid.toString());
                    return p ? p.id : null;
                }).filter(Boolean)
            };

            // Upsert by title since ID might be new
            await Artwork.findOneAndUpdate({ title: art.title }, update, { upsert: true, new: true });
        }

        console.log("✅ Artworks seeded".green);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedArtworks();
