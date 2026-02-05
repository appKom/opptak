import { useEffect, useState } from "react";
import type { NextPage } from "next";
import ApplicationForm from "../../components/form/ApplicationForm";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import WellDoneIllustration from "../../components/icons/illustrations/WellDoneIllustration";
import CheckBoxIcon from "../../components/icons/icons/CheckBoxIcon";
import Button from "../../components/Button";
import CalendarIcon from "../../components/icons/icons/CalendarIcon";
import { Tabs } from "../../components/Tabs";
import { DeepPartial, applicantType, periodType } from "../../lib/types/types";
import { useRouter } from "next/router";
import Schedule from "../../components/committee/Schedule";
import { validateApplication } from "../../lib/utils/validateApplication";
import ApplicantCard from "../../components/applicantoverview/ApplicantCard";
import LoadingPage from "../../components/LoadingPage";
import { formatDateNorwegian } from "../../lib/utils/dateUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPeriodById } from "../../lib/api/periodApi";
import {
  createApplicant,
  deleteApplicant,
  fetchApplicantByPeriodAndId,
} from "../../lib/api/applicantApi";
import ErrorPage from "../../components/ErrorPage";
import { MainTitle, SimpleTitle } from "../../components/Typography";
import { getCommitteeDisplayNameFactory } from "../../lib/utils/getCommitteeDisplayNameFactory";
import { isBefore } from "date-fns";

const Application: NextPage = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const router = useRouter();
  const periodId = router.query["period-id"] as string;
  const applicantId = session?.user?.owId;

  const [getCommitteeDisplayName, setGetCommitteeDisplayName] = useState<
    (committee: string) => string
    // Uses a wrapper function to not interpret the function as a setStateAction-function
  >(() => (committee: string) => committee);
  useEffect(() => {
    const inner = async () => {
      const getCommitteeDisplayName = await getCommitteeDisplayNameFactory();
      setGetCommitteeDisplayName(() => getCommitteeDisplayName);
    };
    inner();
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const [applicationData, setApplicationData] = useState<
    DeepPartial<applicantType>
  >({
    owId: session?.user?.owId,
    name: session?.user?.name,
    email: session?.user?.email,
    phone: session?.user?.phone || "",
    grade: "1",
    about: "",
    optionalCommittees: [],
    preferences: {
      first: "",
      second: "",
      third: "",
    },
  });
  const [period, setPeriod] = useState<periodType>();
  const [isApplicationPeriodOver, setIsApplicationPeriodOver] = useState(false);

  const {
    data: periodData,
    isError: periodIsError,
    isLoading: periodIsLoading,
  } = useQuery({
    queryKey: ["periods", periodId],
    queryFn: fetchPeriodById,
  });

  const {
    data: fetchedApplicationData,
    isError: applicantIsError,
    isLoading: applicantIsLoading,
  } = useQuery({
    queryKey: ["applicant", periodId, applicantId],
    queryFn: fetchApplicantByPeriodAndId,
  });

  const createApplicantMutation = useMutation({
    mutationFn: createApplicant,
    onSuccess: () => {
      queryClient.setQueryData(["applicant", periodId, applicantId], {
        applicant: applicationData,
        exists: true,
      });
      toast.success("Søknad sendt inn");
    },
    onError: (error) => {
      if (error.message === "409 Application already exists for this period") {
        toast.error("Du har allerede søkt for denne perioden");
      } else {
        toast.error("Det skjedde en feil, vennligst prøv igjen");
      }
    },
  });

  const deleteApplicantMutation = useMutation({
    mutationFn: deleteApplicant,
    onSuccess: () => {
      queryClient.setQueryData(["applicant", periodId, applicantId], null);
      toast.success("Søknad trukket tilbake");
      setActiveTab(0);
    },
    onError: () => toast.error("Det skjedde en feil, vennligst prøv igjen"),
  });

  useEffect(() => {
    if (!periodData || !periodData.period) return;

    setPeriod(periodData.period);

    const now = new Date();
    if (
      isBefore(periodData.period.applicationPeriod.end, now)
    ) {
      setIsApplicationPeriodOver(true);
    }
  }, [periodData]);

  const handleSubmitApplication = async () => {
    if (!validateApplication(applicationData)) return;

    // Validate selected times
    if (
      applicationData.selectedTimes &&
      applicationData.selectedTimes.length === 0
    ) {
      toast.error("Velg minst én tilgjengelig tid");
      return false;
    }

    applicationData.periodId = periodId as string;
    createApplicantMutation.mutate(applicationData as applicantType);
  };

  const handleDeleteApplication = async () => {
    if (!session?.user?.owId) {
      toast.error("User ID not found");
      return;
    }

    if (!confirm("Er du sikker på at du vil trekke tilbake søknaden?")) return;

    deleteApplicantMutation.mutate({ periodId, owId: session?.user?.owId });
  };

  if (
    periodIsLoading ||
    applicantIsLoading ||
    createApplicantMutation.isPending ||
    deleteApplicantMutation.isPending
  )
    return <LoadingPage />;
  if (periodIsError || applicantIsError) return <ErrorPage />;

  if (!periodData?.exists || !period)
    return <SimpleTitle title="Opptaket finnes ikke" size="large" />;

  if (fetchedApplicationData?.exists)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-5 py-10 md:px-40 lg:px-80 dark:text-white">
        <WellDoneIllustration className="h-32" />
        <p className="max-w-md text-lg text-center">
          Vi har mottatt din søknad og sendt deg en bekreftelse på e-post og
          SMS! Dobbeltsjekk at du har mottatt e-posten og SMS-en.
        </p>
        <p className="max-w-md text-lg text-center">
          Du vil få enda en e-post med intervjutider når søknadsperioden er over
          (rundt {formatDateNorwegian(period?.applicationPeriod.end)}).
        </p>
        <p className="max-w-md text-center text-gray-500">
          (Hvis du ikke finner e-posten din, sjekk søppelpost- eller
          spam-mappen.)
        </p>
        {!isApplicationPeriodOver && (
          <Button
            title="Trekk tilbake søknad"
            color="white"
            onClick={handleDeleteApplication}
          />
        )}
        {fetchedApplicationData?.application && (
          <div className="w-full max-w-md">
            <ApplicantCard
              applicant={fetchedApplicationData.application}
              includePreferences={true}
            />
          </div>
        )}

        {applicationData.phone && (
          <div className="w-full max-w-md">
            <ApplicantCard
              applicant={applicationData as applicantType}
              includePreferences={true}
            />
          </div>
        )}
      </div>
    );

  return (
    <div>
      <div className="flex flex-col items-center gap-5">
        <MainTitle
          boldMainTitle={period?.name}
          subTitle={formatDateNorwegian(period?.applicationPeriod.end) || ""}
          boldSubTitle="Søknadsfrist"
        />
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          content={[
            {
              title: "Søknad",
              icon: <CheckBoxIcon className="w-5 h-5" />,
              content: (
                <>
                  <ApplicationForm
                    applicationData={applicationData}
                    setApplicationData={setApplicationData}
                    availableCommittees={period?.committees || []}
                    optionalCommittees={period?.optionalCommittees || []}
                    getCommitteeDisplayName={getCommitteeDisplayName}
                  />
                  <div className="flex justify-center w-full">
                    <Button
                      title="Videre"
                      color="blue"
                      onClick={() => {
                        if (!validateApplication(applicationData)) return;
                        setActiveTab(activeTab + 1);
                      }}
                      size="small"
                    />
                  </div>
                </>
              ),
            },
            {
              title: "Intervjutider",
              icon: <CalendarIcon className="w-5 h-5" />,
              content: (
                <div className="flex flex-col items-center justify-center">
                  <Schedule
                    interviewLength={Number(30)}
                    periodTime={period?.interviewPeriod}
                    setApplicationData={setApplicationData}
                    applicationData={applicationData}
                  />
                  <div className="flex justify-center w-full mt-10">
                    <Button
                      title="Send inn søknad"
                      color="blue"
                      onClick={handleSubmitApplication}
                      size="small"
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Application;
