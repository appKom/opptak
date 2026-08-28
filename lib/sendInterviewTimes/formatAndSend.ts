import {
  emailCommitteeInterviewType,
  emailApplicantInterviewType,
} from "../types/types";

import sendEmail from "../email/sendEmail";
import sendSMS from "../sms/sendSMS";
import {
  formatApplicantInterviewEmail,
  formatCommitteeInterviewEmail,
} from "./formatInterviewEmail";
import { formatInterviewSMS } from "./formatInterviewSMS";
import { changeDisplayName } from "../utils/toString";

interface sendInterviewTimesProps {
  committeesToEmail: emailCommitteeInterviewType[];
  applicantsToEmail: emailApplicantInterviewType[];
}

export const formatAndSendEmails = async ({
  committeesToEmail,
  applicantsToEmail,
}: sendInterviewTimesProps) => {
  try {
    // Send email to each applicant
    applicantsToEmail.forEach(
      async (applicant: emailApplicantInterviewType) => {
        let potentialError;

        try {
          await sendEmail({
            toEmails: [applicant.applicantEmail],
            subject: `Hei, ${applicant.applicantName}, her er dine intervjutider:`,
            htmlContent: formatApplicantInterviewEmail(applicant),
          });
        } catch (error) {
          potentialError = error;
        } finally {
          sendSMS(
            `+${applicant.applicantPhone}`,
            formatInterviewSMS(applicant),
          );
        }

        if (potentialError) {
          throw potentialError;
        }
      },
    );

    // Send email to each committee
    committeesToEmail.forEach(
      async (committee: emailCommitteeInterviewType) => {
        const subject = `${changeDisplayName(
          committee.committeeName,
        )} sine intervjutider for ${committee.period_name}`;

        await sendEmail({
          toEmails: [committee.committeeEmail],
          subject: subject,
          htmlContent: formatCommitteeInterviewEmail(committee),
        });
      },
    );
  } catch (error) {
    return { error: "Failed to send out interview times" };
  }
};
