import { WithId } from "mongodb";
import { getApplications } from "../mongo/applicants";
import { getCommitteesByPeriod } from "../mongo/committees";
import { getInterviewsByPeriod } from "../mongo/interviews";
import { getPeriodById, markInterviewsSentByPeriodId } from "../mongo/periods";
import { getCommitteesFromOw } from "../ow/committees";
import {
  algorithmType,
  applicantType,
  committeeEmails,
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

    // Get committees for period
    const committeeInterviewTimesData = await getCommitteesByPeriod(periodId);
    if (!committeeInterviewTimesData || committeeInterviewTimesData.error) {
      return { error: "Failed to find committee interview times" };
    }
    const committeeEmails = (await getCommitteesFromOw()).map((committee) => ({
      name_short: committee.abbreviation,
      email: committee.email,
    }));

    // Get applicants for period
    const applicants = await getApplications(periodId);
    if (applicants.error) {
      return {
        error:
          "Failed to find applicants for given period: " + applicants.error,
      };
    }

    const fetchedAlgorithmData = await getInterviewsByPeriod(periodId);
    const algorithmData = fetchedAlgorithmData.interviews || [];

    const applicantsToEmail = await formatApplicants(
      applicants.applications!, // Should exist since would return if applicants.error
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
  applicants: WithId<applicantType>[],
  algorithmData: algorithmType[],
  periodId: string,
  period: periodType,
  committeeEmails: committeeEmails[],
): Promise<emailApplicantInterviewType[]> => {
  return applicants.map((applicant) => {
    const matchedInterviews =
      algorithmData.find((datum) => applicant._id.equals(datum.applicantId))
        ?.interviews ?? [];

    const allCommittees = [
      ...[
        applicant.preferences.first,
        applicant.preferences.second,
        applicant.preferences.third,
      ].filter((committee) => committee !== ""),
      ...applicant.optionalCommittees,
    ];

    const committees = allCommittees.map((committee) => {
      const interviewWithCommitteeName = matchedInterviews.find(
        (interview) => interview.committeeName == committee,
      );
      const interview = interviewWithCommitteeName
        ? {
            // Applicant has gotten interview with this committee
            start: interviewWithCommitteeName.start,
            end: interviewWithCommitteeName.end,
            room: interviewWithCommitteeName.room,
          }
        : {
            // Applicant has NOT gotten interview with this committee
            start: "Ikke satt",
            end: "Ikke satt",
            room: "Ikke satt",
          };

      const committeeEmail = committeeEmails.find(
        (email) => email.name_short.toLowerCase() === committee.toLowerCase(),
      );

      return {
        committeeName: committee,
        committeeEmail: committeeEmail?.email ?? "",
        interviewTime: interview,
      };
    });

    return {
      periodId: periodId,
      period_name: period.name,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantPhone: applicant.phone,
      committees: committees,
    };
  });
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
