import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { periodType } from "../types/types";

let client: MongoClient;
let db: Db;
let periods: Collection<periodType>;

async function init() {
  if (db) return;
  try {
    client = await clientPromise;
    db = client.db();
    periods = db.collection("periods");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to establish connection to database");
  }
}

(async () => {
  await init();
})();

export const createPeriod = async (periodData: periodType) => {
  try {
    if (!periods) await init();

    const result = await periods.insertOne(periodData);
    if (result.insertedId) {
      const insertedPeriod = await periods.findOne({
        _id: result.insertedId,
      });
      if (insertedPeriod) {
        return { period: insertedPeriod };
      } else {
        return { error: "Failed to retrieve the created period" };
      }
    } else {
      return { error: "Failed to create period" };
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to create period" };
  }
};

export const getPeriods = async () => {
  try {
    if (!periods) await init();
    const result = await periods.find({}).toArray();
    return { periods: result };
  } catch (error) {
    return { error: "Failed to fetch periods" };
  }
};

export const getCurrentPeriods = async () => {
  try {
    if (!periods) await init();

    const now = new Date();

    const filter = {
      $or: [
        {
          // Check if current date is within the application period
          "applicationPeriod.start": { $lte: now },
          "applicationPeriod.end": { $gte: now },
        },
        {
          // Check if current date is within the interview period
          "interviewPeriod.start": { $lte: now },
          "interviewPeriod.end": { $gte: now },
        },
      ],
    };

    const result = await periods.find(filter).toArray();

    return { result: result };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch periods" };
  }
};

export const getPeriodById = async (id: string | ObjectId) => {
  try {
    if (!periods) await init();

    if (typeof id === "string" && !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid ID format");
      return { error: "Invalid ID format", exists: false };
    }

    const period = await periods.findOne({ _id: new ObjectId(id) });

    if (period) {
      return { exists: true, period };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch period by ID", exists: false };
  }
};

export const deletePeriodById = async (periodId: string | ObjectId) => {
  try {
    if (!periods) await init();

    const result = await periods.deleteOne({
      _id: new ObjectId(periodId),
    });

    return result.deletedCount === 1
      ? { message: "Period deleted successfully" }
      : { error: "Period not found or already deleted" };
  } catch (error) {
    return { error: "Failed to delete period" };
  }
};

export const markInterviewsSentByPeriodId = async (periodId: string) => {
  try {
    if (!periods) await init();

    const objectPeriodId = new ObjectId(periodId);

    const result = await periods.findOneAndUpdate(
      { _id: objectPeriodId },
      {
        $set: { hasSentInterviewTimes: true },
      }
    );
    {
      return { result: result };
    }
  } catch (error) {
    return { error: "Failed to update hasSentInterviewTimes" };
  }
};
