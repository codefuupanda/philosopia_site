import colors from "colors";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "../db/client.js";
import quotesData from "../data/quotes.js";

// Injects the quotes arrays onto existing philosopher items (nested { en, he }).

const seedQuotes = async () => {
  try {
    console.log("💬 Starting Comprehensive Quote Injection...".magenta.bold);

    let updatedCount = 0;

    for (const data of quotesData) {
      try {
        const res = await ddb.send(new UpdateCommand({
          TableName: TABLES.content,
          Key: { entityType: "philosopher", id: data.philosopherId },
          UpdateExpression: "SET quotes = :q",
          ConditionExpression: "attribute_exists(id)", // don't create ghost items
          ExpressionAttributeValues: { ":q": { en: data.quotesEn, he: data.quotesHe } },
          ReturnValues: "ALL_NEW",
        }));
        console.log(`✅ Updated quotes for: ${res.Attributes?.name?.en}`.green);
        updatedCount++;
      } catch (e) {
        if (e.name === "ConditionalCheckFailedException") {
          console.log(`❌ Philosopher not found: ${data.philosopherId}`.red);
        } else {
          throw e;
        }
      }
    }

    console.log(`\nDone! Updated ${updatedCount} philosophers.`.green.bold);
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedQuotes();
