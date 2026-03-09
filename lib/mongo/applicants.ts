import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { applicantType, periodType } from "../types/types";
import clientPromise from "./mongodb";
import { getPeriodById } from "./periods";

let client: MongoClient;
let db: Db;
let applicants: Collection<applicantType>;

async function init() {
  if (db) return;
  try {
    client = await clientPromise;
    db = client.db();
    applicants = db.collection("applications");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to establish connection to database");
  }
}

(async () => {
  await init();
})();

export const createApplicant = async (applicantData: applicantType) => {
  try {
    if (!applicants) await init();

    const existingApplicant = await applicants.findOne({
      owId: applicantData.owId,
      periodId: applicantData.periodId,
    });

    if (existingApplicant) {
      return { error: "409 Application already exists for this period" };
    }

    const result = await applicants.insertOne(applicantData);
    if (result.insertedId) {
      const insertedApplicant = await applicants.findOne({
        _id: result.insertedId,
      });
      if (insertedApplicant) {
        return { applicant: insertedApplicant };
      } else {
        return { error: "Failed to retrieve the created applicant" };
      }
    } else {
      return { error: "Failed to create applicant" };
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to create applicant" };
  }
};

// Edit applicant based on owId and periodId
export const editApplicant = async (applicantData: applicantType) => {
  try {
    if (!applicants) await init();

    const existingApplicant = await applicants.findOne({
      owId: applicantData.owId,
      periodId: applicantData.periodId,
    });

    if (!existingApplicant) {
      return { error: "404 Application not found" };
    }

    const result = await applicants.updateOne(
      { _id: existingApplicant._id },
      { $set: applicantData }
    );

    if (result.modifiedCount === 1) {
      const updatedApplicant = await applicants.findOne({
        _id: existingApplicant._id,
      });
      if (updatedApplicant) {
        return { applicant: updatedApplicant };
      } else {
        return { error: "Failed to retrieve the updated applicant" };
      }
    } else {
      return { error: "Failed to update applicant" };
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to update applicant" };
  }
};

export const getApplicants = async () => {
  try {
    if (!applicants) await init();
    const result = await applicants.find({}).toArray();
    return { applicants: result };
  } catch (error) {
    return { error: "Failed to fetch applicants" };
  }
};

export const getApplication = async (
  id: string,
  periodId: string | ObjectId,
) => {
  try {
    if (!applicants) await init();

    const result = await applicants.findOne({
      owId: id,
      periodId: periodId,
    });

    return { application: result, exists: !!result };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch application", exists: false };
  }
};

export const getApplicationByMongoId = async (
  id: string,
  periodId: string | ObjectId,
) => {
  try {
    if (!applicants) await init();

    const objectId = new ObjectId(id);

    const result = await applicants.findOne({
      _id: objectId,
      periodId: periodId,
    });

    return { application: result, exists: !!result };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch application", exists: false };
  }
};

export const getApplications = async (periodId: string) => {
  try {
    if (!applicants) await init();

    const result = await applicants
      .find({ periodId: periodId }) // No ObjectId conversion needed
      .toArray();

    return { applications: result, exists: result.length > 0 };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch applications" };
  }
};

export const getApplicantsForCommittee = async (
  periodId: string,
  selectedCommittee: string,
  userCommittees: string[],
) => {
  try {
    if (!applicants) await init();

    // Henter alle søkere for perioden
    const allApplicantsInPeriod = await applicants
      .find({ periodId: periodId })
      .toArray();

    const periodData = await getPeriodById(periodId);
    const period: periodType | undefined = periodData.period;

    if (!period) {
      return { error: "Period not found" };
    }

    // Filtrerer søkerne slik at kun brukere som er i komiteen som har blitt søkt på ser søkeren
    // Fjerner prioriteringsinformasjon
    const filteredApplicants = allApplicantsInPeriod
      .map((applicant) => {
        let preferencesArray: string[] = [
          applicant.preferences.first,
          applicant.preferences.second,
          applicant.preferences.third,
          ...(applicant.optionalCommittees ?? []),
        ];

        // Sjekker om brukerens komite er blant søkerens komiteer
        const hasCommonCommittees = preferencesArray.some((preference) =>
          userCommittees.includes(preference),
        );

        // Skjuler søkerinformasjon for komitéen etter syv dager etter intervjuperioden
        const today = new Date();
        const sevenDaysAfterInterviewEnd = new Date(period.interviewPeriod.end);
        sevenDaysAfterInterviewEnd.setDate(
          sevenDaysAfterInterviewEnd.getDate() + 5,
        );

        if (
          new Date(period.applicationPeriod.end) > today ||
          today > sevenDaysAfterInterviewEnd
        ) {
          applicant.owId = "Skjult";
          applicant.name = "Skjult";
          applicant.date = today;
          applicant.phone = "Skjult";
          applicant.email = "Skjult";
          applicant.about = "Skjult";
          applicant.grade = "-";
          applicant.selectedTimes = [{ start: "Skjult", end: "Skjult" }];
        }

        const isSelectedCommitteePresent =
          preferencesArray.includes(selectedCommittee);

        if (hasCommonCommittees && isSelectedCommitteePresent) {
          // Fjerner prioriteringer
          const { preferences, ...rest } = applicant;
          const filteredPreferences = preferencesArray
            .filter((preference) => userCommittees.includes(preference))
            .map((committee) => ({ committee }));

          return { ...rest, preferences: filteredPreferences };
        }
        return null;
      })
      .filter((applicant) => applicant !== null);

    return { applicants: filteredApplicants };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch applicants" };
  }
};

export const deleteApplication = async (
  owId: string,
  periodId: string | ObjectId,
) => {
  try {
    if (!applicants) await init();

    const result = await applicants.deleteOne({
      owId: owId,
      periodId: periodId,
    });

    if (result.deletedCount === 1) {
      return { message: "Application deleted successfully" };
    } else {
      return { error: "Application not found or already deleted" };
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete application" };
  }
};
