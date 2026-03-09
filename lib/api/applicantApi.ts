import { QueryFunctionContext } from "@tanstack/react-query";
import { applicantType } from "../types/types";

export const fetchApplicantByPeriodAndId = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  const applicantId = context.queryKey[2];
  return fetch(`/api/applicants/${periodId}/${applicantId}`).then((res) =>
    res.json()
  );
};

export const fetchApplicantsByPeriodId = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  return fetch(`/api/applicants/${periodId}`).then((res) => res.json());
};

export const fetchApplicantsByPeriodIdAndCommittee = async (
  context: QueryFunctionContext
) => {
  const periodId = context.queryKey[1];
  const committee = context.queryKey[2];
  return fetch(`/api/committees/applicants/${periodId}/${committee}`).then(
    (res) => res.json()
  );
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
