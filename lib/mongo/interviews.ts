import { Collection, Db, MongoClient } from "mongodb";
import clientPromise from "./mongodb";
import { algorithmType } from "../types/types";

let client: MongoClient;
let db: Db;
let interviews: Collection<algorithmType>;

async function init() {
  if (db) return;
  try {
    client = await clientPromise;
    db = client.db();
    interviews = db.collection("interviews");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to establish connection to database");
  }
}

(async () => {
  await init();
})();

export const getInterviewsByPeriod = async (periodId: string) => {
  try {
    if (!interviews) await init();
    const result = await interviews.find({ periodId: periodId }).toArray();
    return { interviews: result };
  } catch (error) {
    return { error: "Failed to fetch interviews" };
  }
};

export const getInterviewsByPeriodAndApplicantId = async (
  periodId: string,
  applicantId: string,
) => {
  try {
    if (!interviews) await init();
    const result = await interviews.findOne({
      periodId: periodId,
      applicantId: applicantId,
    });
    return { interviews: result };
  } catch (error) {
    return { error: "Failed to fetch interviews" };
  }
};
