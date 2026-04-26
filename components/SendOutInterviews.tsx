import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { periodType } from "../lib/types/types";
import Button from "./Button";

interface Props {
  period: periodType | null;
}

const SendOutInterviews = ({ period }: Props) => {
  const queryClient = useQueryClient();

  const [isWaitingOnMatching, setIsWaitingOnMatching] = useState(false);

  const runMatching = async ({ periodId }: { periodId: string }) => {
    const confirm = window.confirm(
      "Er du sikker på at du vil matche intervjuer?",
    );

    if (!confirm) return;

    try {
      const response = await fetch(`/api/periods/match-interviews/${periodId}`);

      if (!response.ok) {
        throw new Error("Failed to match interviews");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      toast.success("Intervjuene ble matchet!");

      return data;
    } catch (error) {
      toast.error("Mathcing av intervjuer feilet");
      console.error(error);
    }
  };

  const sendOutInterviewTimes = async ({ periodId }: { periodId: string }) => {
    const confirm = window.confirm(
      "Er du sikker på at du vil sende ut intervjutider?",
    );

    if (!confirm) return;

    try {
      const response = await fetch(
        `/api/periods/send-interview-times/${periodId}`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to send out interview times");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      toast.success("Intervjutider er sendt ut! (Sjekk konsoll loggen)");
      return data;
    } catch (error) {
      toast.error("Klarte ikke å sende ut intervjutider");
    }
  };

  return (
    <div className="flex flex-col items-center overflow-hidden w-[50%] m-auto border-gray-300 border-2 bg-zinc-50 rounded-lg">
      <h2 className="w-full text-white p-2 shadow- text-lg bg-online-darkTeal m-0 shadow-xl">
        Matching av intervjutider
      </h2>
      <div className="m-4 flex flex-col items-center gap-4">
        <p className="w-full">
          Sett opp intervjutider automatisk ved å kjøre matching. Systemet vil
          sette opp så mange intervjuer som mulig basert på tidspunktene som
          komitéene og søkerne har satt opp.
        </p>
        <p className="w-full">
          I tillegg optimaliseres det for følgende undermål (i prioritert
          rekkefølge):
        </p>
        <ul className="w-full list-disc list-inside">
          <li>
            Intervjutidspunkt er nærmest mulig midt på dagen. Dette hindrer i
            tillegg unødvendige tomrom i en intervjubolk.
          </li>
          <li>
            Første dagen unngås forsøksvis. Dette gjøres for å gi søkere best
            mulig tid til å planlegge fra intervjutiden blir sendt.
          </li>
        </ul>

        <hr className="my-2 w-full" />

        {!period?.hasMatchedInterviews && (
          <Button
            title={isWaitingOnMatching ? "Kjører matching..." : "Kjør matching"}
            color={"blue"}
            disabled={period?.hasMatchedInterviews || isWaitingOnMatching}
            onClick={async () => {
              setIsWaitingOnMatching(true);
              await runMatching({ periodId: period!._id.toString() }).then(
                (result) => {
                  setIsWaitingOnMatching(false);

                  // refetch state
                  queryClient.invalidateQueries({
                    queryKey: ["periods", period?._id],
                  });
                },
              );
            }}
          />
        )}

        {period?.hasMatchedInterviews && period.matching_status && (
          <div className="flex flex-col items-center p-2 border border-gray-300 gap-4">
            <div className="flex flex-row gap-4 border-b p-1">
              <h3>Matching gjennomført</h3>
              <p
                className={
                  "rounded-xl p-1 w-fit " +
                  (period.matching_status.status == "OptimizationStatus.OPTIMAL"
                    ? "bg-green-300"
                    : "bg-red-300")
                }
              >
                Status:{" "}
                {period.matching_status.status.replace(
                  "OptimizationStatus.",
                  "",
                )}
              </p>
            </div>
            <p className="w-fit">
              Klarte å matche{" "}
              <span className="bg-gray-300 rounded-xl p-1">
                {period.matching_status.matched_meetings} av{" "}
                {period.matching_status.total_wanted_meetings}
              </span>{" "}
              intervjuer.
            </p>
          </div>
        )}

        {period?.hasMatchedInterviews &&
          (!period?.hasSentInterviewTimes ? (
            <Button
              title={"Send ut intervjutider"}
              color={"blue"}
              disabled={
                !period?.hasMatchedInterviews && !period?.hasSentInterviewTimes
              }
              onClick={async () =>
                await sendOutInterviewTimes({
                  periodId: period!._id.toString(),
                }).then(() => {
                  // refetch state
                  queryClient.invalidateQueries({
                    queryKey: ["periods", period?._id],
                  });
                })
              }
            />
          ) : (
            <p>Intervjuer er sendt ut!</p>
          ))}
      </div>
    </div>
  );
};

export default SendOutInterviews;
