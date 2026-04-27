import { QueryFunctionContext } from "@tanstack/react-query";
import { periodType } from "../types/types";
import { parsePeriodDates } from "../utils/parseDates";

export const fetchPeriodById = async (context: QueryFunctionContext) => {
  const id = context.queryKey[1];
  const data = await fetch(`/api/periods/${id}`).then((res) => res.json());
  return {
    ...data,
    period: data.period ? parsePeriodDates(data.period) : undefined,
  };
};

export const fetchPeriods = async () => {
  const data = await fetch(`/api/periods`).then((res) => res.json());
  return {
    ...data,
    periods: data.periods?.map(parsePeriodDates),
  };
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
