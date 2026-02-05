import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ErrorPage from "../../components/ErrorPage";
import PeriodCard from "../../components/PeriodCard";
import { fetchPeriods } from "../../lib/api/periodApi";
import { periodType } from "../../lib/types/types";
import { PeriodSkeletonPage } from "../../components/PeriodSkeleton";
import { SimpleTitle } from "../../components/Typography";
import { isAfterOrEqual, isBeforeOrEqual } from "../../lib/utils/dateUtils";

const Apply = () => {
  const [currentPeriods, setCurrentPeriods] = useState<periodType[]>([]);
  const [upcomingPeriods, setUpcomingPeriods] = useState<periodType[]>([])

  const {
    data: periodsData,
    isError: periodsIsError,
    isLoading: periodsIsLoading,
  } = useQuery({
    queryKey: ["periods"],
    queryFn: fetchPeriods,
  });

  useEffect(() => {
    if (!periodsData) return;

    const now = new Date();

    setCurrentPeriods(
      periodsData.periods.filter((period: periodType) => {
        const startDate = period.applicationPeriod.start;
        const endDate = period.applicationPeriod.end;

        return isBeforeOrEqual(startDate, now) && isAfterOrEqual(endDate, now);
      })
    );

    setUpcomingPeriods(
      periodsData.periods.filter((period: periodType) => isAfterOrEqual(period.applicationPeriod.start, now))
    )
  }, [periodsData]);

  if (periodsIsLoading) return <PeriodSkeletonPage />;
  if (periodsIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col justify-between overflow-x-hidden text-online-darkBlue dark:text-white">
      <div className="flex flex-col items-center justify-center gap-5 px-5">
        {currentPeriods.length === 0 && upcomingPeriods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-8">
            <SimpleTitle title="Ingen åpne opptak for øyeblikket" />
            <p className="w-10/12 max-w-2xl text-center text-md ">
              Opptak til{" "}
              <Link
                href="/committees"
                className="underline text-online-darkBlue dark:text-white hover:text-online-orange dark:hover:text-online-orange"
              >
                komiteene
              </Link>{" "}
              skjer vanligvis i august etter fadderuka. Noen komiteer har
              vanligvis suppleringsopptak i februar.
              <br />
              <br />
              Følg med på{" "}
              <Link
                href="https://online.ntnu.no"
                className="underline text-online-darkBlue dark:text-white hover:text-online-orange dark:hover:text-online-orange"
              >
                online.ntnu.no
              </Link>{" "}
              eller på vår{" "}
              <Link
                href="https://www.facebook.com/groups/1547182375336132"
                className="underline text-online-darkBlue dark:text-white hover:text-online-orange dark:hover:text-online-orange"
              >
                Facebook-gruppe
              </Link>{" "}
              for kunngjøringer!
            </p>
          </div>
        ) : (
          <>
            {currentPeriods.length > 0 ? (
              <div className="flex flex-col gap-10">
                <SimpleTitle title="Nåværende opptaksperioder" />
                <div className="flex flex-col items-center max-w-full gap-5">
                  {currentPeriods.map((period: periodType, index: number) => (
                    <PeriodCard key={index} period={period} active={true} />
                  ))}
                </div>
              </div>
            ) : <></>}
            {upcomingPeriods.length > 0 ? (
              <div className="flex flex-col gap-10 mt-16">
                <SimpleTitle title="Kommende opptaksperioder" />
                <div className="flex flex-col items-center max-w-full gap-5">
                  {upcomingPeriods.map((period: periodType, index: number) => (
                    <PeriodCard key={index} period={period} active={false} />
                  ))}
                </div>
              </div>
            ) : <></>}
          </>
        )
        }
      </div>
    </div>
  );
};

export default Apply;
