import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import router, { useRouter } from "next/router";
import { periodType } from "../../../lib/types/types";
import NotFound from "../../404";
import { Tabs } from "../../../components/Tabs";
import { CalendarIcon, InboxIcon } from "@heroicons/react/24/solid";
import Button from "../../../components/Button";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import LoadingPage from "../../../components/LoadingPage";
import ErrorPage from "../../../components/ErrorPage";
import { fetchInterviewsByPeriodAndApplicantId } from "../../../lib/api/interviewsApi";
import { fetchApplicantByPeriodAndId } from "../../../lib/api/applicantApi";
import InterviewConfirmationBox from "../../../components/InterviewConfirmationCard";

const Admin = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const router = useRouter();
  const periodId = router.query["period-id"] as string;
  const applicantId = session?.user?.owId;

  const {
    data: applicantData,
    isError: applicantIsError,
    isLoading: applicantIsLoading,
  } = useQuery({
    queryKey: ["applicant", periodId, applicantId],
    queryFn: fetchApplicantByPeriodAndId,
    enabled: !!periodId && !!applicantId,
  });

  const {
    data: interviewsData,
    isError: interviewsIsError,
    isLoading: interviewsIsLoading,
  } = useQuery({
    queryKey: ["interviews", periodId, applicantData?.application?._id],
    queryFn: fetchInterviewsByPeriodAndApplicantId,
    enabled: !!periodId && !!applicantData?.application?._id, // Vent til applicantData finnes
  });

  console.log("InterviewsData:", interviewsData);

  if (applicantIsLoading || interviewsIsLoading) return <LoadingPage />;
  if (applicantIsError || interviewsIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col gap-5 justify-center items-center min-h-screen">
      <h1 className="text-3xl font-bold">
        Bekreft intervjuer for {session?.user?.name}
      </h1>
      <div>
        {interviewsData && interviewsData.interviews.length > 0 ? (
          interviewsData.interviews.map((interview: any, index: number) => (
            <InterviewConfirmationBox key={index} interview={interview} />
          ))
        ) : (
          <p className="text-gray-500">Ingen intervjuer å bekrefte.</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
