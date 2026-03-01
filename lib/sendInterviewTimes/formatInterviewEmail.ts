import {
  emailApplicantInterviewType,
  emailCommitteeInterviewType,
} from "../types/types";
import { formatDateHours } from "../utils/dateUtils";

import { changeDisplayName } from "../utils/toString";

export const formatApplicantInterviewEmail = (
  applicant: emailApplicantInterviewType,
) => {
  let emailBody = `<p>Hei <strong>${applicant.applicantName}</strong>,</p><p>Her er dine intervjutider for ${applicant.period_name}:</p><ul><br/>`;

  applicant.committees.sort((a, b) => {
    return (
      new Date(a.interviewTime.start).getTime() -
      new Date(b.interviewTime.start).getTime()
    );
  });

  applicant.committees.forEach((committee) => {
    emailBody += `<li><b>Komité:</b> ${changeDisplayName(
      committee.committeeName,
    )}<br>`;

    if (committee.interviewTime.start !== "Ikke satt") {
      emailBody += `<b>Tid:</b> ${formatDateHours(
        committee.interviewTime.start,
        committee.interviewTime.end,
      )}<br>`;
    }
    if (committee.interviewTime.start === "Ikke satt") {
      emailBody += `<b>Tid:</b> Ikke satt. Komitéen vil ta kontakt med deg for å avtale tidspunkt.<br>`;
    }

    emailBody += `<b>Rom:</b> ${committee.interviewTime.room}</li><br>`;
  });

  emailBody += `</ul> <br/> <br/> <p>Fått et tidspunkt som ikke passer? Ta kontakt med komitéen du skal på intervju hos.</p><p>Skjedd en feil? Ta kontakt med <a href="mailto:appkom@online.ntnu.no">Appkom</a>❤️</p>`;

  return emailBody;
};

export const formatCommitteeInterviewEmail = (
  committee: emailCommitteeInterviewType,
) => {
  let emailBody = `<p>Hei <strong>${changeDisplayName(
    committee.committeeName,
  )}</strong>,</p><p>Her er deres intervjutider for ${
    committee.applicants.length
  } søkere:</p><ul>`;

  committee.applicants.sort((a, b) => {
    return (
      new Date(a.interviewTime.start).getTime() -
      new Date(b.interviewTime.start).getTime()
    );
  });

  committee.applicants.forEach((applicant) => {
    emailBody += `<li><b>Navn:</b> ${applicant.applicantName}<br>`;
    emailBody += `<b>Telefon:</b> ${applicant.applicantPhone} <br> `;

    if (applicant.interviewTime.start !== "Ikke satt") {
      emailBody += `<b>Tid:</b> ${formatDateHours(
        applicant.interviewTime.start,
        applicant.interviewTime.end,
      )}<br>`;
    }

    if (applicant.interviewTime.start === "Ikke satt") {
      emailBody += `<b>Tid:</b> Ikke satt. Ta kontakt med søker for å avtale tidspunkt.<br>`;
    }
    emailBody += `<b>Rom:</b> ${applicant.interviewTime.room}</li><br>`;
  });

  emailBody += `</ul> <br/> <br/> <p>Skjedd en feil? Ta kontakt med <a href="mailto:appkom@online.ntnu.no">Appkom</a>❤️</p>`;

  return emailBody;
};
