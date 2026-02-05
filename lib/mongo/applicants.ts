import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { applicantType, Nullable, periodType, preferencesType } from "../types/types";
import { getPeriodById } from "./periods";
import { addDays, isAfter } from 'date-fns';

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
  periodId: string | ObjectId
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
  periodId: string | ObjectId
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
  userCommittees: string[]
) => {
  try {
    if (!applicants) await init();

    // Henter alle søkere for perioden
    const result = await applicants.find({ periodId: periodId }).toArray();

    const periodData = await getPeriodById(periodId);
    const period: periodType | undefined = periodData.period;

    if (!period) {
      return { error: "Period not found" };
    }

    // Type guard
    const isPreferencesType = (
      preferences: any
    ): preferences is preferencesType => {
      return (
        preferences &&
        typeof preferences.first === "string" &&
        typeof preferences.second === "string" &&
        typeof preferences.third === "string"
      );
    };

    // Filtrerer søkerne slik at kun brukere som er i komiteen som har blitt søkt på ser søkeren
    // Fjerner prioriterings informasjon
    const filteredApplicants = result
      .map((applicant: Nullable<applicantType>) => {
        let preferencesArray: string[] = [];
        if (isPreferencesType(applicant.preferences)) {
          preferencesArray = [
            applicant.preferences.first,
            applicant.preferences.second,
            applicant.preferences.third,
          ];
        } else if (Array.isArray(applicant.preferences)) {
          preferencesArray = applicant.preferences.map(
            (pref) => pref.committee
          );
        }

        if (applicant.optionalCommittees != null) {
          if (applicant.optionalCommittees.length > 0) {
            for (const committee of applicant.optionalCommittees) {
              preferencesArray.push(committee);
            }
          }
        }

        // Sjekker om brukerens komite er blant søkerens komiteer
        const hasCommonCommittees = preferencesArray.some((preference) =>
          userCommittees.includes(preference)
        );

        applicant.optionalCommittees = [];

        const now = new Date();
        const sevenDaysAfterInterviewEnd = addDays(period.interviewPeriod.end, 7);

        // Sletter sensitiv informasjon etter intervju perioden + 7 dager, for å forhindre snoking i tidligere søknader
        if (
          isAfter(now, period.applicationPeriod.end) ||
          isAfter(now, sevenDaysAfterInterviewEnd)
        ) {
          applicant.owId = null;
          applicant.name = null;
          applicant.phone = null;
          applicant.grade = null;
          applicant.email = null;
          applicant.about = null;
          applicant.selectedTimes = null;
          applicant.date = null;
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
  periodId: string | ObjectId
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
