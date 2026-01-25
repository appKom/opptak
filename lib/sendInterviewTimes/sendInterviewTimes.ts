import { getApplicationByMongoId } from "../mongo/applicants";
import { getCommitteesByPeriod } from "../mongo/committees";
import { getInterviewsByPeriod } from "../mongo/interviews";
import { getPeriodById, markInterviewsSentByPeriodId } from "../mongo/periods";
import { getCommitteesFromOw } from "../ow/committees";
import {
  algorithmType,
  committeeEmails,
  committeePreferenceType,
  emailApplicantInterviewType,
  emailCommitteeInterviewType,
  periodType,
} from "../types/types";
import { formatAndSendEmails } from "./formatAndSend";

export const sendOutInterviewTimes = async ({
  periodId,
}: {
  periodId: string;
}): Promise<{ success: true } | { error: string }> => {
  try {
    const { period } = await getPeriodById(periodId);
    if (!period) {
      return { error: "Failed to find period" };
    }

    if (period.hasSentInterviewTimes) {
      return { error: "Interview times already sent" };
    }

    const committeeInterviewTimesData = await getCommitteesByPeriod(periodId);
    if (!committeeInterviewTimesData || committeeInterviewTimesData.error) {
      return { error: "Failed to find committee interview times" };
    }

    const committeeEmails = (await getCommitteesFromOw()).map((committee) => ({
      name_short: committee.abbreviation,
      email: committee.email,
    }));

    const fetchedAlgorithmData = await getInterviewsByPeriod(periodId);
    const algorithmData = fetchedAlgorithmData.interviews || [];

    const applicantsToEmail = await formatApplicants(
      algorithmData,
      periodId,
      period,
      committeeEmails,
    );

    const committeesToEmail = formatCommittees(applicantsToEmail);

    await formatAndSendEmails({ committeesToEmail, applicantsToEmail });
    markInterviewsSentByPeriodId(periodId);

    return { success: true };
  } catch (error) {
    return { error: "Failed to send out interview times" };
  }
};

const formatApplicants = async (
  algorithmData: algorithmType[],
  periodId: string,
  period: periodType,
  committeeEmails: committeeEmails[],
): Promise<emailApplicantInterviewType[]> => {
  const applicantsToEmailMap: emailApplicantInterviewType[] = [];

  for (const app of algorithmData) {
    const dbApplication = await getApplicationByMongoId(
      app.applicantId,
      periodId,
    );

    if (!dbApplication || !dbApplication.application) continue;

    const preferencesCommittees: string[] =
      "first" in dbApplication.application.preferences
        ? [
            dbApplication.application.preferences.first,
            dbApplication.application.preferences.second,
            dbApplication.application.preferences.third,
          ].filter((committee) => committee !== "")
        : dbApplication.application.preferences.map(
            (preference: committeePreferenceType) => preference.committee,
          );

    const allCommittees = [
      ...preferencesCommittees,
      ...dbApplication.application.optionalCommittees,
    ];

    const scheduledCommittees = app.interviews.map(
      (interview) => interview.committeeName,
    );

    const missingCommittees = allCommittees.filter(
      (committee) => !scheduledCommittees.includes(committee),
    );

    const committees = app.interviews.map((interview) => {
      const committeeEmail = committeeEmails.find(
        (email) =>
          email.name_short.toLowerCase() ===
          interview.committeeName.toLowerCase(),
      );

      return {
        committeeName: interview.committeeName,
        committeeEmail: committeeEmail?.email || "",
        interviewTime: {
          start: interview.start,
          end: interview.end,
          room: interview.room,
        },
      };
    });

    for (const missingCommittee of missingCommittees) {
      const committeeEmail = committeeEmails.find(
        (email) =>
          email.name_short.toLowerCase() === missingCommittee.toLowerCase(),
      );

      committees.push({
        committeeName: missingCommittee,
        committeeEmail: committeeEmail?.email || "",
        interviewTime: {
          start: "Ikke satt",
          end: "Ikke satt",
          room: "Ikke satt",
        },
      });
    }

    const applicantToEmail = {
      periodId: periodId,
      period_name: period.name,
      applicantName: dbApplication.application.name,
      applicantEmail: dbApplication.application.email,
      applicantPhone: dbApplication.application.phone,
      committees: committees,
    };

    applicantsToEmailMap.push(applicantToEmail);
  }

  return applicantsToEmailMap;
};

const formatCommittees = (
  applicantsToEmailMap: emailApplicantInterviewType[],
): emailCommitteeInterviewType[] => {
  const committeesToEmail: { [key: string]: emailCommitteeInterviewType } = {};

  for (const applicant of applicantsToEmailMap) {
    for (const committee of applicant.committees) {
      if (!committeesToEmail[committee.committeeName]) {
        committeesToEmail[committee.committeeName] = {
          periodId: applicant.periodId,
          period_name: applicant.period_name,
          committeeName: committee.committeeName,
          committeeEmail: committee.committeeEmail,
          applicants: [],
        };
      }

      committeesToEmail[committee.committeeName].applicants.push({
        applicantName: applicant.applicantName,
        applicantPhone: applicant.applicantPhone,
        applicantEmail: applicant.applicantEmail,
        interviewTime: committee.interviewTime,
      });
    }
  }

  return Object.values(committeesToEmail);
};
