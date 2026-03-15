import {
  applicantType,
  committeeInterviewType,
  periodType,
  preferencesType,
} from "../types/types";

export const isPreferencesType = (
  preferences: any,
): preferences is preferencesType => {
  return (
    preferences &&
    typeof preferences.first === "string" &&
    typeof preferences.second === "string" &&
    typeof preferences.third === "string"
  );
};

export const isApplicantType = (
  applicant: applicantType,
  period: periodType,
): applicant is applicantType => {
  // Check for each basic property type
  const applicantPeriodId = applicant.periodId.toString();
  const periodId = period._id.toString();

  const { owId, name, email, phone, grade, about, bankom, date } = applicant;

  const hasBasicFields =
    typeof owId === "string" &&
    typeof name === "string" &&
    typeof email === "string" &&
    typeof phone === "string" &&
    typeof grade === "string" &&
    typeof about === "string" &&
    typeof bankom === "string" &&
    (bankom === "ja" || bankom === "nei" || bankom === "kanskje") &&
    typeof applicantPeriodId === "string" &&
    applicantPeriodId === periodId &&
    date instanceof Date;

  // Check that the preferences object exists and contains the required fields
  const periodCommittees = period.committees.map((committee) =>
    committee.toLowerCase(),
  );

  const { first, second, third } = applicant.preferences as preferencesType;
  const applicantOptionalCommittees = applicant.optionalCommittees;

  const hasPreferencesFields =
    ((applicant.preferences as preferencesType) && typeof first === "string") ||
    (first === "" &&
      applicantOptionalCommittees.length !== 0 &&
      (typeof second === "string" || second === "") &&
      (typeof third === "string" || third === "") &&
      // Ensure that non-empty preferences are unique
      first !== second &&
      (first === "" || first !== third) &&
      (second === "" || second !== third) &&
      // Ensure preferences are in period committees or empty
      periodCommittees.includes(first) &&
      (second === "" || periodCommittees.includes(second)) &&
      (third === "" || periodCommittees.includes(third)));

  // Check that the selectedTimes array is valid

  // const interviewPeriodStart = new Date(period.interviewPeriod.start);
  // const interviewPeriodEnd = new Date(period.interviewPeriod.end);

  /* 
    JEG FJERNER hasSelectedTimes VALIDATOREN INNTIL DATOER ER FIKSET.
    DATOENE SOM SENDES INN HER ER HELT FEIL, OG DET ER BARE TILFELDIG AT DE IKKE HAR TRIGGET VALIDATOREN ENDA.
    DET SKAL UANSETT IKKE VÆRE MULIG Å VELGE DATOER UTENFOR DET PERIODEN TILLATER GJENNOM SCHEDULE KOMPONENTEN.
  */

  // const hasSelectedTimes =
  //   Array.isArray(applicant.selectedTimes) &&
  //   applicant.selectedTimes.every(
  //     (time: { start: string; end: string }) =>
  //       typeof time.start === "string" &&
  //       typeof time.end === "string" &&
  //       new Date(time.start) >= interviewPeriodStart &&
  //       new Date(time.start) <= interviewPeriodEnd &&
  //       new Date(time.end) <= interviewPeriodEnd &&
  //       new Date(time.end) >= interviewPeriodStart &&
  //       new Date(time.start) < new Date(time.end),
  //   );

  const periodOptionalCommittees = period.optionalCommittees.map((committee) =>
    committee.toLowerCase(),
  );

  const hasOptionalFields =
    applicantOptionalCommittees &&
    Array.isArray(applicantOptionalCommittees) &&
    applicantOptionalCommittees.every(
      (committee: any) =>
        typeof committee === "string" &&
        periodOptionalCommittees.includes(committee),
    );

  return (
    hasBasicFields &&
    hasPreferencesFields &&
    hasOptionalFields
    // hasSelectedTimes
  );
};

export const isCommitteeType = (data: any): data is committeeInterviewType => {
  const hasBasicFields =
    typeof data.period_name === "string" &&
    typeof data.committee === "string" &&
    typeof data.timeslot === "string" &&
    Array.isArray(data.availabletimes) &&
    data.availabletimes.every(
      (time: { start: string; end: string }) =>
        typeof time.start === "string" && typeof time.end === "string",
    );

  return hasBasicFields;
};

export const validateCommittee = (data: any, period: periodType): boolean => {
  const hasBasicFields =
    typeof data.period_name === "string" &&
    typeof data.committee === "string" &&
    typeof data.timeslot === "string" &&
    Array.isArray(data.availabletimes) &&
    data.availabletimes.every(
      (time: { start: string; end: string }) =>
        typeof time.start === "string" && typeof time.end === "string",
    );

  const isPeriodNameValid = data.periodId === String(period._id);

  const isBeforeDeadline = new Date() <= new Date(period.applicationPeriod.end);

  const committeeExists =
    period.committees.some((committee) => {
      return committee.toLowerCase() === data.committee.toLowerCase();
    }) ||
    period.optionalCommittees.some((committee) => {
      return committee.toLowerCase() === data.committee.toLowerCase();
    });

  const isWithinInterviewPeriod = data.availabletimes.every(
    (time: { start: string; end: string }) => {
      const startTime = new Date(time.start);
      const endTime = new Date(time.end);

      return (
        startTime >= new Date(period.interviewPeriod.start) &&
        startTime <= new Date(period.interviewPeriod.end) &&
        endTime <= new Date(period.interviewPeriod.end) &&
        endTime >= new Date(period.interviewPeriod.start) &&
        startTime < endTime
      );
    },
  );

  return (
    hasBasicFields &&
    isPeriodNameValid &&
    committeeExists &&
    isWithinInterviewPeriod &&
    isBeforeDeadline
  );
};

export const isPeriodType = (data: any): data is periodType => {
  const isDateString = (str: any): boolean => {
    return typeof str === "string" && !isNaN(Date.parse(str));
  };

  const isValidPeriod = (period: any): boolean => {
    return (
      typeof period === "object" &&
      period !== null &&
      isDateString(period.start) &&
      isDateString(period.end)
    );
  };

  const isChronological = (start: string, end: string): boolean => {
    return new Date(start) <= new Date(end);
  };

  const arePeriodsValid = (
    applicationPeriod: any,
    interviewPeriod: any,
  ): boolean => {
    return (
      isChronological(applicationPeriod.start, applicationPeriod.end) &&
      isChronological(interviewPeriod.start, interviewPeriod.end) &&
      new Date(applicationPeriod.end) <= new Date(interviewPeriod.start)
    );
  };

  const hasBasicFields =
    typeof data.name === "string" &&
    typeof data.description === "string" &&
    isValidPeriod(data.applicationPeriod) &&
    isValidPeriod(data.interviewPeriod) &&
    Array.isArray(data.committees) &&
    data.committees.every((committee: any) => typeof committee === "string") &&
    arePeriodsValid(data.applicationPeriod, data.interviewPeriod);

  return hasBasicFields;
};
