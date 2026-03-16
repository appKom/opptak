import { useQuery } from "@tanstack/react-query";
import {
  applicantType,
  committeeInterviewType,
  preferencesType,
} from "../../lib/types/types";
import { fetchCommitteesByPeriod } from "../../lib/api/committeesApi";
import { fetchApplicantsByPeriodId } from "../../lib/api/applicantApi";
import Table, { RowType } from "../Table";
import { TableSkeleton } from "../skeleton/TableSkeleton";
import ErrorPage from "../ErrorPage";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

type CommitteeRow = committeeInterviewType & {
  _id?: string;
};

const columns = [
  { label: "Komité", field: "committee" },
  { label: "Søknader", field: "applications" },
  { label: "Intervjukapasitet / tidsblokker", field: "interviewsPlanned" },
  { label: "Intervjulengde", field: "timeslot" },
];

const getApplicantCommittees = (applicant: applicantType): string[] => {
  const preferences = applicant.preferences;
  const preferenceCommittees: string[] =
    (preferences as preferencesType).first !== undefined
      ? [
          (preferences as preferencesType).first,
          (preferences as preferencesType).second,
          (preferences as preferencesType).third,
        ]
      : (preferences as unknown as { committee: string }[]).map(
          (preference) => preference.committee,
        );

  return [
    ...preferenceCommittees.filter((committee) => committee),
    ...(applicant.optionalCommittees ?? []),
  ];
};

const calculateInterviewsPlanned = (committee: committeeInterviewType) => {
  const timeslotMinutes = parseInt(committee.timeslot, 10);
  if (!timeslotMinutes || !committee.availabletimes) return 0;

  const totalMinutes = committee.availabletimes.reduce((acc, time) => {
    const start = new Date(time.start);
    const end = new Date(time.end);
    const duration = (end.getTime() - start.getTime()) / 1000 / 60;
    return acc + duration;
  }, 0);

  return Math.floor(totalMinutes / timeslotMinutes);
};

const getInterviewStatus = (
  planned: number,
  applications: number,
  thresholdRatio = 1.5
) => {
  if (applications === 0) {
    return {
      tone: "green",
      message: "Ingen søkere ennå. Behold gjerne tider tilgjengelig.",
    };
  }

  const ratio = planned / applications;

  if (ratio >= thresholdRatio) {
    return {
      tone: "green",
      message: "God dekning av intervjutider.",
    };
  }

  if (ratio >= 1) {
    return {
      tone: "yellow",
      message: `Bør legge til flere tider (mål: ${thresholdRatio}x søkere).`,
    };
  }

  return {
    tone: "red",
    message: "For få tider. Komitéen må legge inn flere intervjutider.",
  };
};

const CommitteeCard = ({ periodId }: { periodId?: string }) => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["committees-by-period", periodId],
    queryFn: fetchCommitteesByPeriod,
    enabled: !!periodId,
  });

  const {
    data: applicationsData,
    isError: applicationsIsError,
    isLoading: applicationsIsLoading,
  } = useQuery({
    queryKey: ["applications-by-period", periodId],
    queryFn: fetchApplicantsByPeriodId,
    enabled: !!periodId,
  });

  if (!periodId) {
    return <div className="px-5">Mangler periodId.</div>;
  }

  if (isLoading || applicationsIsLoading)
    return <TableSkeleton columns={columns} />;
  if (isError || applicationsIsError) return <ErrorPage />;

  const committees: CommitteeRow[] = data?.committees ?? [];
  const applications: applicantType[] = applicationsData?.applications ?? [];

  if (committees.length === 0) {
    return <div className="px-5">Ingen komiteer har levert tider enda.</div>;
  }

  const rows: RowType[] = committees.map((committee, index) => {
    const interviewsPlanned = calculateInterviewsPlanned(committee);
    const availableCount = committee.availabletimes?.length ?? 0;
    const applicationsCount = applications.filter((application) => {
      const applicantCommittees = getApplicantCommittees(application).map(
        (value) => value.toLowerCase(),
      );
      return applicantCommittees.includes(committee.committee.toLowerCase());
    }).length;
    const status = getInterviewStatus(interviewsPlanned, applicationsCount);
    const statusClasses =
      status.tone === "green"
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : status.tone === "yellow"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return {
      id: committee._id?.toString?.() ?? `${committee.committee}-${index}`,
      committee: <span className="block text-center">{committee.committee}</span>,
      applications: <span className="block text-center">{applicationsCount}</span>,
      interviewsPlanned: (
        <span className="inline-flex w-full items-center justify-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusClasses}`}>
            {`${interviewsPlanned} / ${availableCount}`}
          </span>
          <InformationCircleIcon
            className="h-4 w-4 text-gray-400"
            title={status.message}
          />
        </span>
      ),
      timeslot: <span className="block text-center">{committee.timeslot} min</span>,
    };
  });

  return (
    <div className="w-full mx-auto max-w-6xl">
      <Table columns={columns} rows={rows} />
    </div>
  );
};

export default CommitteeCard;
