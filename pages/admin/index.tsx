import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, ChartLineIcon, HomeIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PreviousAdmissions } from "../../components/admin/PreviousAdmissions";
import Button from "../../components/Button";
import ErrorPage from "../../components/ErrorPage";
import { TableSkeleton } from "../../components/skeleton/TableSkeleton";
import { StepByStep } from "../../components/StepByStep";
import Table, { RowType } from "../../components/Table";
import { Tabs } from "../../components/Tabs";
import { SimpleTitle } from "../../components/Typography";
import { deletePeriodById, fetchPeriods } from "../../lib/api/periodApi";
import { periodType } from "../../lib/types/types";
import { formatDate } from "../../lib/utils/dateUtils";
import NotFound from "../404";

const Admin = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(0);

  const [periods, setPeriods] = useState<RowType[]>([]);

  const {
    data: periodsData,
    isError: periodsIsError,
    isLoading: periodsIsLoading,
  } = useQuery({
    queryKey: ["periods"],
    queryFn: fetchPeriods,
  });

  const deletePeriodByIdMutation = useMutation({
    mutationFn: deletePeriodById,
    onSuccess: () =>
      queryClient.invalidateQueries({
        // TODO: try to update cache instead
        queryKey: ["periods"],
      }),
  });

  useEffect(() => {
    if (!periodsData) return;

    setPeriods(
      periodsData.periods.map((period: periodType) => {
        return {
          id: period._id,
          name: period.name,
          application:
            formatDate(period.applicationPeriod.start) +
            " til " +
            formatDate(period.applicationPeriod.end),
          interview:
            formatDate(period.interviewPeriod.start) +
            " til " +
            formatDate(period.interviewPeriod.end),
          committees: period.committees,
          link: `/admin/${period._id}`,
        };
      }),
    );
  }, [periodsData]);

  const deletePeriod = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Er det sikker på at du ønsker å slette ${name}?`,
    );
    if (!isConfirmed) return;
    deletePeriodByIdMutation.mutate(id);
  };

  useEffect(() => {
    if (deletePeriodByIdMutation.isSuccess) toast.success("Periode slettet");
    if (deletePeriodByIdMutation.isError)
      toast.error("Noe gikk galt, prøv igjen");
  }, [deletePeriodByIdMutation]);

  const periodsColumns = [
    { label: "Navn", field: "name" },
    { label: "Søknad", field: "application" },
    { label: "Intervju", field: "interview" },
    { label: "Delete", field: "delete" },
  ];

  if (!session || session.user?.role !== "admin") return <NotFound />;
  if (periodsIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col items-center justify-center">
      <SimpleTitle title="Administrasjon av opptaksperioder" />
      <Tabs
        activeTab={activeTab}
        setActiveTab={(index) => {
          setActiveTab(index);
        }}
        content={[
          {
            title: "Hvordan?",
            icon: <HomeIcon className="w-5 h-5" />,
            content: (
              <div className="w-[30%] m-auto">
                <StepByStep
                  item={{
                    title: "Hvordan gjennomføre opptak?",
                    content: [
                      "Opprett opptaksperiode ved å velge datoer og komiteer for opptaket.",
                      "Komitéer og søkere angir når de er ledige for intervjuer",
                      'Etter søknadsperioden, kjører du opptaket ved å gå inn på opptaket og følge instruksjonene under fanen "Send ut intervjutider".',
                    ],
                  }}
                />

                <hr className="w-full" />
              </div>
            ),
          },
          {
            title: "Opptaksperioder",
            icon: <CalendarIcon className="w-5 h-5" />,
            content: (
              <div className="m-auto flex flex-col items-center justify-center">
                <div className="py-10">
                  <Button
                    title="Opprett ny opptaksperiode"
                    color="blue"
                    href="/admin/new-period"
                  />
                </div>

                {periodsIsLoading ? (
                  <TableSkeleton columns={periodsColumns} />
                ) : (
                  <Table
                    columns={periodsColumns}
                    rows={periods}
                    onDelete={deletePeriod}
                  />
                )}
              </div>
            ),
          },
          {
            title: "Statistikk",
            icon: <ChartLineIcon className="w-5 h-5" />,
            content: <PreviousAdmissions />,
          },
        ]}
      />
    </div>
  );
};

export default Admin;
