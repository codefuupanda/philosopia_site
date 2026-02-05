import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import Philosopher from "../models/Philosopher.js";
import quotesData from "../data/quotes.js";

dotenv.config();

const seedQuotes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("💬 Starting Comprehensive Quote Injection...".magenta.bold);

    let updatedCount = 0;

    for (const data of quotesData) {
      const update = {
        quotes: { en: data.quotesEn, he: data.quotesHe },
        quotesEn: data.quotesEn,
        quotesHe: data.quotesHe
      };

      const phil = await Philosopher.findOneAndUpdate(
        { id: data.philosopherId },
        update,
        { new: true }
      );

      if (phil) {
        console.log(`✅ Updated quotes for: ${phil.nameEn}`.green);
        updatedCount++;
      } else {
        console.log(`❌ Philosopher not found: ${data.philosopherId}`.red);
      }
    }

    console.log(`\nDone! Updated ${updatedCount} philosophers.`.green.bold);
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedQuotes();
