import { QueryFunctionContext } from "@tanstack/react-query";
import { OwGroup } from "../types/types";
import { parseCommitteeDates } from "../utils/parseDates";

export const fetchOwCommittees = async (): Promise<OwGroup[]> => {
  return fetch(`/api/periods/ow-committees`).then((res) => res.json());
};

export const fetchCommitteeTimes = async (context: QueryFunctionContext) => {
  const periodId = context.queryKey[1];
  const committee = context.queryKey[2];

  const data = await fetch(
    `/api/committees/times/${periodId}/${committee}`,
  ).then((res) => res.json());
  return {
    ...data,
    committees: data.committees?.map(parseCommitteeDates),
  };
};
