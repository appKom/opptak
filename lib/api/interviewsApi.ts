import { QueryFunctionContext } from "@tanstack/react-query";

export const fetchInterviewsByPeriodAndApplicantId = async (
  context: QueryFunctionContext,
) => {
  const periodId = context.queryKey[1];
  const applicantId = context.queryKey[2];

  const response = await fetch(`/api/interviews/${periodId}/${applicantId}`);
  if (!response.ok) throw new Error("Failed to fetch interviews");
  const data = await response.json();
  return data.interviews;
};
