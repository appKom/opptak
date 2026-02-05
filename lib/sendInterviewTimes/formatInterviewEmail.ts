import { compareAsc } from "date-fns";
import {
  emailApplicantInterviewType,
  emailCommitteeInterviewType,
} from "../types/types";
import { formatDateHours } from "../utils/dateUtils";

import { changeDisplayName } from "../utils/toString";

export const formatApplicantInterviewEmail = (
  applicant: emailApplicantInterviewType
) => {
  let emailBody = `<p>Hei <strong>${applicant.applicantName}</strong>,</p><p>Her er dine intervjutider for ${applicant.period_name}:</p><ul><br/>`;

  // Sort committees by interview start time
  applicant.committees.sort((a, b) => 
    compareAsc(a.interviewTime.start, b.interviewTime.start)
  );

  applicant.committees.forEach((committee) => {
    emailBody += `<li><b>Komité:</b> ${changeDisplayName(
      committee.committeeName
    )}<br>`;

    if (committee.interviewTime.start != null) {
      emailBody += `<b>Tid:</b> ${formatDateHours(
        committee.interviewTime.start,
        committee.interviewTime.end
      )}<br>`;
    } else {
      emailBody += `<b>Tid:</b> Ikke satt. Komitéen vil ta kontakt med deg for å avtale tidspunkt.<br>`;
    }

    emailBody += `<b>Rom:</b> ${committee.interviewTime.room}</li><br>`;
  });

  emailBody += `</ul> <br/> <br/> <p>Fått et tidspunkt som ikke passer? Ta kontakt med komitéen du skal på intervju hos.</p><p>Skjedd en feil? Ta kontakt med <a href="mailto:appkom@online.ntnu.no">Appkom</a>❤️</p>`;

  return emailBody;
};

export const formatCommitteeInterviewEmail = (
  committee: emailCommitteeInterviewType
) => {
  let emailBody = `<p>Hei <strong>${changeDisplayName(
    committee.committeeName
  )}</strong>,</p><p>Her er deres intervjutider for ${
    committee.applicants.length
  } søkere:</p><ul>`;

  // Sort applicants by interview start time
  committee.applicants.sort((a, b) => 
    compareAsc(a.interviewTime.start, b.interviewTime.start)
  );

  committee.applicants.forEach((applicant) => {
    emailBody += `<li><b>Navn:</b> ${applicant.applicantName}<br>`;
    emailBody += `<b>Telefon:</b> ${applicant.applicantPhone} <br> `;

    if (applicant.interviewTime.start != null) {
      emailBody += `<b>Tid:</b> ${formatDateHours(
        applicant.interviewTime.start,
        applicant.interviewTime.end
      )}<br>`;
    } else {
      emailBody += `<b>Tid:</b> Ikke satt. Ta kontakt med søker for å avtale tidspunkt.`;
    }
    emailBody += `<b>Rom:</b> ${applicant.interviewTime.room}</li><br>`;
  });

  emailBody += `</ul> <br/> <br/> <p>Skjedd en feil? Ta kontakt med <a href="mailto:appkom@online.ntnu.no">Appkom</a>❤️</p>`;

  return emailBody;
};
