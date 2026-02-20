import { QueryFunctionContext } from "@tanstack/react-query";
import { OwGroup } from "../types/types";

export const fetchOwCommittees = async (): Promise<OwGroup[]> => {
  return fetch(`/api/periods/ow-committees`).then((res) => res.json());
};

export const fetchCommitteeTimes = async (context: QueryFunctionContext) => {
  const periodId = context.queryKey[1];
  const committee = context.queryKey[2];

  return fetch(`/api/committees/times/${periodId}/${committee}`).then((res) =>
    res.json(),
  );
};
