import { DeepPartial, periodType } from "../../lib/types/types";

export const validateChangedInterviewPeriod = (
    changed: DeepPartial<periodType>,
    applicantsData: any,
    owCommitteesData: any
): boolean => {
    let earliest = new Date(8640000000000000);
    let latest = new Date(0);
    for (const application of applicantsData.applications) {
        if (earliest > new Date(application.selectedTimes[0].start)) {
            earliest = new Date(application.selectedTimes[0].start);
        }
        if (latest < new Date(application.selectedTimes.at(-1).end)) {
            latest = new Date(application.selectedTimes.at(-1).end);
        }
    }

    if ((changed.interviewPeriod?.start && earliest < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && latest > changed.interviewPeriod.end)) {
        return window.confirm("Du har fjernet intervjutider som minst en søker har markert. Dette kan skape problemer. Er du sikker på at du vil fortsette?")
    }

    earliest = new Date(8640000000000000);
    latest = new Date(0);
    for (const committee of owCommitteesData.result) {
        if (earliest > new Date(committee.availabletimes.at(0).start)) {
            earliest = new Date(committee.availabletimes.at(0).start);
        }
        if (latest < new Date(committee.availabletimes.at(-1).end)) {
            latest = new Date(committee.availabletimes.at(-1).end);
        }
    }

    if ((changed.interviewPeriod?.start && earliest < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && latest > changed.interviewPeriod.end)) {
        return window.confirm("Du har fjernet intervjutider som minst en komite har markert. Dette kan skape problemer. Er du sikker på at du vil fortsette?")
    }

    return true;
}

export const validateChangedCommittees = (
    original: periodType,
    changed: DeepPartial<periodType>,
    applicantsData: any
): boolean => {
    const illegalRemovals: string[] = []
    const removedLowerCase: string[] = [];
    original.committees.map((committee) => {
        if (!changed.committees?.includes(committee)) {
            removedLowerCase.push(committee.toLowerCase());
        }
    })

    for (const application of applicantsData.applications) {
        if (removedLowerCase && application.preferences.first != '' && removedLowerCase.includes(application.preferences.first) && !illegalRemovals.includes(application.preferences.first)) {
            illegalRemovals.push(application.preferences.first);
        }
        if (removedLowerCase && application.preferences.second != '' && removedLowerCase.includes(application.preferences.second) && !illegalRemovals.includes(application.preferences.second)) {
            illegalRemovals.push(application.preferences.second);
        }
        if (removedLowerCase && application.preferences.third != '' && removedLowerCase.includes(application.preferences.third) && !illegalRemovals.includes(application.preferences.third)) {
            illegalRemovals.push(application.preferences.third);
        }
    }

    if (illegalRemovals.length > 0) {
        const formattedCommittees = illegalRemovals
            .map(c => c.charAt(0).toUpperCase() + c.slice(1))
            .join("\n");

        const confirmMessage =
            "Følgende komiteer du har fjernet har minst en søker:\n" +
            formattedCommittees +
            "\n\nDette kan skape problemer. Ønsker du å fortsette?";

        return window.confirm(confirmMessage);
    }
    return true;
}

export const validateChangedOptionalCommittees = (
  original: periodType,
  changed: DeepPartial<periodType>,
  applicantsData: any
): boolean => {
  const illegalRemovals: string[] = []
  const removedLowerCase: string[] = [];
  original.optionalCommittees.map((committee) => {
      if (!changed.optionalCommittees?.includes(committee)) {
        removedLowerCase.push(committee.toLowerCase());
      }
  });
  for (const application of applicantsData.applications) {
    for (const committee of application.optionalCommittees) {
      if (removedLowerCase.includes(committee.toLowerCase()) && !illegalRemovals.includes(committee.toLowerCase())) {
        illegalRemovals.push(committee.toLowerCase());
      } 
    }
  }

  if (illegalRemovals.length > 0) {
        const formattedCommittees = illegalRemovals
            .map(c => c.charAt(0).toUpperCase() + c.slice(1))
            .join("\n");

        const confirmMessage =
            "Følgende valgfrie komiteer du har fjernet har minst en søker:\n" +
            formattedCommittees +
            "\n\nDette kan skape problemer. Ønsker du å fortsette?";

        return window.confirm(confirmMessage);
    }
    return true;
}