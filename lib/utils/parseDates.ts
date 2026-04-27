import {
  applicantType,
  committeeInterviewType,
  periodType,
} from "../types/types";

/**
 * Parses date strings in a period object to Date objects.
 * Used both server-side (after JSON.parse of req.body) and
 * client-side (after fetch .json() response).
 */
export function parsePeriodDates(raw: any): periodType {
  return {
    ...raw,
    applicationPeriod: {
      start: new Date(raw.applicationPeriod.start),
      end: new Date(raw.applicationPeriod.end),
    },
    interviewPeriod: {
      start: new Date(raw.interviewPeriod.start),
      end: new Date(raw.interviewPeriod.end),
    },
  };
}

/**
 * Parses date strings in an applicant object to Date objects.
 */
export function parseApplicantDates(raw: any): applicantType {
  return {
    ...raw,
    date: raw.date ? new Date(raw.date) : new Date(),
    selectedTimes: Array.isArray(raw.selectedTimes)
      ? raw.selectedTimes.map((t: any) => ({
          start: new Date(t.start),
          end: new Date(t.end),
        }))
      : [],
  };
}

/**
 * Parses date strings in a committee interview type to Date objects.
 */
export function parseCommitteeDates(
  raw: any,
): committeeInterviewType {
  return {
    ...raw,
    availabletimes: Array.isArray(raw.availabletimes)
      ? raw.availabletimes.map((t: any) => ({
          start: new Date(t.start),
          end: new Date(t.end),
          room: t.room,
        }))
      : [],
  };
}
