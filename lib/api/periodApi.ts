import { QueryFunctionContext } from "@tanstack/react-query";
import { periodType } from "../types/types";

export const fetchPeriodById = async (context: QueryFunctionContext) => {
  const id = context.queryKey[1];
  return fetch(`/api/periods/${id}`).then((res) => res.json());
};

export const fetchPeriods = async () => {
  return fetch(`/api/periods`).then((res) => res.json());
};

export const deletePeriodById = async (id: string) => {
  return fetch(`/api/periods/${id}`, {
    method: "DELETE",
  });
};

export const createPeriod = async (period: periodType) => {
  return fetch(`/api/periods`, {
    method: "POST",
    body: JSON.stringify(period),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const editPeriod = async (updatedFields : Partial<periodType>) => {
  return fetch(`/api/periods/${updatedFields._id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedFields),
    headers: {
      "Content-Type": "application/json",
    },
  });
};