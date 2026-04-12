import { applicantType, AvailableTime, committeeInterviewType, DeepPartial, periodType } from "../../lib/types/types";

export const validateChangedInterviewPeriod = (
    changed: DeepPartial<periodType>,
    applicantsData: any,
    owCommitteesData: any
): boolean => {
    const illegalRemovals = new Set();

    applicantsData.applications.forEach((applicaton: applicantType) => {
        applicaton.selectedTimes.forEach((time: {start: string, end: string}) => {
            if ((changed.interviewPeriod?.start && new Date(time.start) < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && new Date(time.end) > changed.interviewPeriod.end)) {
                illegalRemovals.add(new Date(time.start).toISOString().split("T")[0])
            }
        })
    })

    if (illegalRemovals.size > 0) {
        const formattedDates = Array.from(illegalRemovals)
            .join("\n");

        const errorMessage =
            "Følgende datoer har minst en søker og kan derfor ikke fjernes:\n" +
            formattedDates;

        window.alert(errorMessage)
        return false;
    }

    illegalRemovals.clear();

    owCommitteesData.result.forEach((committee: committeeInterviewType) => {
        committee.availabletimes.forEach((time: AvailableTime) => {
            if ((changed.interviewPeriod?.start && new Date(time.start) < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && new Date(time.end) > changed.interviewPeriod.end)) {
                illegalRemovals.add(new Date(time.start).toISOString().split("T")[0])
            }
        })
    })

    if (illegalRemovals.size > 0) {
        const formattedDates = Array.from(illegalRemovals)
            .join("\n");

        const errorMessage =
            "Følgende datoer er valgt av minst en komite og kan derfor ikke fjernes:\n" +
            formattedDates;

        window.alert(errorMessage)
        return false;
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

        const errorMessage =
            "Følgende komiteer har minst en søker og kan derfor ikke fjernes:\n" +
            formattedCommittees 

        window.alert(errorMessage)
        return false;
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

        const errorMessage =
            "Følgende valgfrie komiteer har minst en søker og kan derfor ikke fjernes:\n" +
            formattedCommittees;

        window.alert(errorMessage);
        return false;
    }
    return true;
}