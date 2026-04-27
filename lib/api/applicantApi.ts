import { QueryFunctionContext } from "@tanstack/react-query";
import { applicantType } from "../types/types";
import { parseApplicantDates } from "../utils/parseDates";

export const fetchApplicantByPeriodAndId = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  const applicantId = context.queryKey[2];
  const data = await fetch(`/api/applicants/${periodId}/${applicantId}`).then(
    (res) => res.json()
  );
  return {
    ...data,
    application: data.application
      ? parseApplicantDates(data.application)
      : undefined,
  };
};

export const fetchApplicantsByPeriodId = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  const data = await fetch(`/api/applicants/${periodId}`).then((res) =>
    res.json()
  );
  return {
    ...data,
    applications: data.applications?.map(parseApplicantDates),
  };
};

export const fetchApplicantsByPeriodIdAndCommittee = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  const committee = context.queryKey[2];
  const data = await fetch(
    `/api/committees/applicants/${periodId}/${committee}`
  ).then((res) => res.json());
  return {
    ...data,
    applicants: data.applicants?.map(parseApplicantDates),
  };
};

export const createApplicant = async (applicant: applicantType) => {
  const response = await fetch(`/api/applicants/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicant),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Unknown error occurred");
  }
  return data;
};

export const deleteApplicant = async ({
  periodId,
  owId,
}: {
  periodId: string;
  owId: string;
}) => {
  const response = await fetch(`/api/applicants/${periodId}/${owId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete the application");
  }

  return response;
};

export const editApplicant = async (applicant: applicantType) => {
  const response = await fetch(`/api/applicants/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicant),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Unknown error occurred");
  }
  return data;
};
