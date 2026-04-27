/**
 * Bygger Date_dev som en migrert kopi av kilde-DB-en (fra MONGODB_URI)
 * via aggregation + $out. Kilde-DB-en berøres ikke.
 *
 * Kjør med: node scripts/migrate-to-new-db.js
 */

const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length > 0) {
          process.env[key.trim()] = rest.join("=").trim();
        }
      }
    }
  }
}

loadEnv();

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI er ikke satt. Sett den i .env.local eller som miljøvariabel.");
  process.exit(1);
}

const TARGET_DB = "Date_dev";

async function runPipeline(sourceDb, sourceColl, pipeline) {
  await sourceDb.collection(sourceColl).aggregate(pipeline).toArray();
}

async function main() {
  const client = new MongoClient(URI);

  try {
    await client.connect();
    const sourceDb = client.db();
    const targetDb = client.db(TARGET_DB);

    console.log(`Kilde-DB: ${sourceDb.databaseName}`);
    console.log(`Mål-DB:   ${TARGET_DB}\n`);

    console.log("Migrerer periods...");
    await runPipeline(sourceDb, "periods", [
      {
        $addFields: {
          "applicationPeriod.start": { $toDate: "$applicationPeriod.start" },
          "applicationPeriod.end": { $toDate: "$applicationPeriod.end" },
          "interviewPeriod.start": { $toDate: "$interviewPeriod.start" },
          "interviewPeriod.end": { $toDate: "$interviewPeriod.end" },
        },
      },
      { $out: { db: TARGET_DB, coll: "periods" } },
    ]);
    console.log(
      `  → ${TARGET_DB}.periods: ${await targetDb.collection("periods").countDocuments()} dokumenter\n`
    );

    console.log("Migrerer applications...");
    await runPipeline(sourceDb, "applications", [
      {
        $addFields: {
          selectedTimes: {
            $map: {
              input: "$selectedTimes",
              as: "t",
              in: {
                start: { $toDate: "$$t.start" },
                end: { $toDate: "$$t.end" },
              },
            },
          },
        },
      },
      { $out: { db: TARGET_DB, coll: "applications" } },
    ]);
    console.log(
      `  → ${TARGET_DB}.applications: ${await targetDb.collection("applications").countDocuments()} dokumenter\n`
    );

    console.log("Migrerer committees...");
    await runPipeline(sourceDb, "committees", [
      {
        $addFields: {
          availabletimes: {
            $map: {
              input: "$availabletimes",
              as: "t",
              in: {
                start: { $toDate: "$$t.start" },
                end: { $toDate: "$$t.end" },
                room: "$$t.room",
              },
            },
          },
        },
      },
      { $out: { db: TARGET_DB, coll: "committees" } },
    ]);
    console.log(
      `  → ${TARGET_DB}.committees: ${await targetDb.collection("committees").countDocuments()} dokumenter\n`
    );

    console.log("Kopierer interviews...");
    await runPipeline(sourceDb, "interviews", [
      { $out: { db: TARGET_DB, coll: "interviews" } },
    ]);
    console.log(
      `  → ${TARGET_DB}.interviews: ${await targetDb.collection("interviews").countDocuments()} dokumenter\n`
    );

    console.log("Kopierer rooms...");
    await runPipeline(sourceDb, "rooms", [
      { $out: { db: TARGET_DB, coll: "rooms" } },
    ]);
    console.log(
      `  → ${TARGET_DB}.rooms: ${await targetDb.collection("rooms").countDocuments()} dokumenter\n`
    );

    console.log("Migrering fullført!");
  } catch (error) {
    console.error("Feil under migrering:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
