import { compareAsc } from "date-fns";
import { emailApplicantInterviewType } from "../types/types";
import { formatDateHours } from "../utils/dateUtils";
import { changeDisplayName } from "../utils/toString";

export const formatInterviewSMS = (applicant: emailApplicantInterviewType) => {
  let phoneBody = `Hei ${applicant.applicantName}, her er dine intervjutider for ${applicant.period_name}: \n \n`;

  // Sort committees by interview start time
  applicant.committees.sort((a, b) => 
    compareAsc(a.interviewTime.start, b.interviewTime.start)
  );

  applicant.committees.forEach((committee) => {
    phoneBody += `Komité: ${changeDisplayName(committee.committeeName)} \n`;

    if (committee.interviewTime.start != null) {
      phoneBody += `Tid: ${formatDateHours(
        committee.interviewTime.start,
        committee.interviewTime.end
      )}\n`;
    } else {
      phoneBody += `Tid: Ikke satt. Komitéen vil ta kontakt for å avtale tidspunkt. \n`;
    }

    phoneBody += `Rom: ${committee.interviewTime.room} \n \n`;
  });

  phoneBody += `Skjedd en feil? Ta kontakt med appkom@online.ntnu.no`;

  return phoneBody;
};
