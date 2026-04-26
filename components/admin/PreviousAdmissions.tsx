import { useQuery } from "@tanstack/react-query";
import Table from "../Table";
import { SimpleTitle } from "../Typography";
import { fetchAllApplicants } from "../../lib/api/applicantApi";
import { applicantType } from "../../lib/types/types";
import { WithId } from "mongodb";

const testData: Statistics = [
  {
    periodId: "test",
    perCommittee: {
      appkom: 100,
      prokom: 30,
      dotkom: 70,
      arrkom: 40,
      ditkom: 60,
    },
    totalApplicants: 100,
    totalInterviews: 300,
  },
  {
    periodId: "testt",
    perCommittee: {
      appkom: 100,
      klirrkom: 30,
      dotkom: 70,
      arrkom: 40,
      ditkom: 60,
    },
    totalApplicants: 100,
    totalInterviews: 300,
  },
];

type Statistics = {
  periodId: string;
  perCommittee: {
    [key: string]: number;
  };
  totalInterviews: number;
  totalApplicants: number;
}[];

const createStatistics = (applications?: WithId<applicantType>[]) => {};

export const PreviousAdmissions = () => {
  const {
    data: applicationsData,
    isError: applicationsIsError,
    isLoading: applicationsIsLoading,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchAllApplicants,
  });

  console.log(applicationsData);
  return (
    <div className="m-auto flex flex-col items-center justify-center">
      <SimpleTitle title="Søkertall ved tidligere opptak" />

      <Table
        columns={[
          { label: "Søknadsperiode", field: "periodId" },
          { label: "Totalt antall søkere", field: "totalApplicants" },
          { label: "Totalt antall intervjuer", field: "totalInterviews" },
          ...Array.from(
            new Set(
              testData.flatMap((row) =>
                Object.entries(row.perCommittee).map(([committee, num]) => {
                  return { label: committee, field: committee };
                }),
              ),
            ),
          ),
        ]}
        rows={testData.map((row, index) => {
          const a = {
            id: String(index),
            periodId: row.periodId,
            totalApplicants: row.totalApplicants,
            totalInterviews: row.totalInterviews,
            ...row.perCommittee,
          };
          console.log(a);
          return a;
        })}
      />
    </div>
  );
};
