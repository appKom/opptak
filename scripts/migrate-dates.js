/**
 * Migreringsscript: Konverterer streng-datoer til BSON Date i MongoDB.
 *
 * Kjør med: node scripts/migrate-dates.js
 *
 * Krever MONGODB_URI miljøvariabel (les fra .env.local eller sett manuelt).
 *
 * Alternativt kan du kjøre innholdet i migrateCollections() direkte i mongosh.
 */

const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

// Forsøk å lese MONGODB_URI fra .env.local
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

async function migratePeriods(db) {
  const periods = db.collection("periods");
  const docs = await periods.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    const needsUpdate =
      typeof doc.applicationPeriod?.start === "string" ||
      typeof doc.applicationPeriod?.end === "string" ||
      typeof doc.interviewPeriod?.start === "string" ||
      typeof doc.interviewPeriod?.end === "string";

    if (!needsUpdate) continue;

    await periods.updateOne(
      { _id: doc._id },
      {
        $set: {
          "applicationPeriod.start": new Date(doc.applicationPeriod.start),
          "applicationPeriod.end": new Date(doc.applicationPeriod.end),
          "interviewPeriod.start": new Date(doc.interviewPeriod.start),
          "interviewPeriod.end": new Date(doc.interviewPeriod.end),
        },
      }
    );
    updated++;
  }

  console.log(`periods: ${updated}/${docs.length} dokumenter oppdatert`);
}

async function migrateApplications(db) {
  const applications = db.collection("applications");
  const docs = await applications.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    if (!Array.isArray(doc.selectedTimes) || doc.selectedTimes.length === 0) continue;

    const needsUpdate = doc.selectedTimes.some(
      (t) => typeof t.start === "string" || typeof t.end === "string"
    );

    if (!needsUpdate) continue;

    const updatedTimes = doc.selectedTimes.map((t) => ({
      start: typeof t.start === "string" ? new Date(t.start) : t.start,
      end: typeof t.end === "string" ? new Date(t.end) : t.end,
    }));

    await applications.updateOne(
      { _id: doc._id },
      { $set: { selectedTimes: updatedTimes } }
    );
    updated++;
  }

  console.log(`applications: ${updated}/${docs.length} dokumenter oppdatert`);
}

async function migrateCommittees(db) {
  const committees = db.collection("committees");
  const docs = await committees.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    if (!Array.isArray(doc.availabletimes) || doc.availabletimes.length === 0) continue;

    const needsUpdate = doc.availabletimes.some(
      (t) => typeof t.start === "string" || typeof t.end === "string"
    );

    if (!needsUpdate) continue;

    const updatedTimes = doc.availabletimes.map((t) => ({
      start: typeof t.start === "string" ? new Date(t.start) : t.start,
      end: typeof t.end === "string" ? new Date(t.end) : t.end,
      room: t.room,
    }));

    await committees.updateOne(
      { _id: doc._id },
      { $set: { availabletimes: updatedTimes } }
    );
    updated++;
  }

  console.log(`committees: ${updated}/${docs.length} dokumenter oppdatert`);
}

async function main() {
  const client = new MongoClient(URI);

  try {
    await client.connect();
    const db = client.db();

    console.log("Starter migrering av datoer...\n");

    await migratePeriods(db);
    await migrateApplications(db);
    await migrateCommittees(db);

    console.log("\nMigrering fullført!");
  } catch (error) {
    console.error("Feil under migrering:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
