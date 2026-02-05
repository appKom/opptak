import { useEffect, useState } from "react";

import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Button from "../../components/Button";
import ApplicationForm from "../../components/form/ApplicationForm";
import CheckboxInput from "../../components/form/CheckboxInput";
import DatePickerInput from "../../components/form/DatePickerInput";
import TextAreaInput from "../../components/form/TextAreaInput";
import TextInput from "../../components/form/TextInput";
import { DeepPartial, periodType } from "../../lib/types/types";
import { validatePeriod } from "../../lib/utils/PeriodValidator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOwCommittees } from "../../lib/api/committeesApi";
import ErrorPage from "../../components/ErrorPage";
import { createPeriod } from "../../lib/api/periodApi";
import { SimpleTitle } from "../../components/Typography";
import { getCommitteeDisplayNameFactory } from "../../lib/utils/getCommitteeDisplayNameFactory";

const NewPeriod = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);

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

  const [periodData, setPeriodData] = useState<DeepPartial<periodType>>({
    name: "",
    description: "",
    applicationPeriod: {
      start: undefined,
      end: undefined,
    },
    interviewPeriod: {
      start: undefined,
      end: undefined,
    },
    committees: [],
    optionalCommittees: [],
    hasSentInterviewTimes: false,
  });

  const {
    data: owCommitteeData,
    isError: owCommitteeIsError,
    isLoading: owCommitteeIsLoading,
  } = useQuery({
    queryKey: ["ow-committees"],
    queryFn: fetchOwCommittees,
  });

  const createPeriodMutation = useMutation({
    mutationFn: createPeriod,
    onSuccess: () =>
      queryClient.invalidateQueries({
        // TODO: try to update cache instead
        queryKey: ["periods"],
      }),
  });

  useEffect(() => {
    if (!owCommitteeData) return;
    setAvailableCommittees(
      owCommitteeData.map(({ abbreviation, email }) => ({
        name: abbreviation,
        value: abbreviation,
        description: email,
      })),
    );
  }, [owCommitteeData]);

  const updateApplicationPeriodDates = ({
    start,
    end,
  }: {
    start: Date;
    end: Date;
  }) => {
    setPeriodData((prevData) => ({
      ...prevData,
      applicationPeriod: {
        start: start,
        end: end,
      },
    }));
  };

  const updateInterviewPeriodDates = ({
    start,
    end,
  }: {
    start: Date;
    end: Date;
  }) => {
    setPeriodData((prevData) => ({
      ...prevData,
      interviewPeriod: {
        start: start,
        end: end,
      },
    }));
  };

  const [availableCommittees, setAvailableCommittees] = useState<
    { name: string; value: string; description: string }[]
  >([]);

  useEffect(() => {
    if (createPeriodMutation.isSuccess) {
      toast.success("Periode opprettet");
      router.push("/admin");
    }
    if (createPeriodMutation.isError) toast.error("Noe gikk galt, prøv igjen");
  }, [createPeriodMutation, router]);

  const handleAddPeriod = async () => {
    if (!validatePeriod(periodData)) return;

    createPeriodMutation.mutate(periodData as periodType);
  };

  const handlePreviewPeriod = () => {
    setShowPreview((prev) => !prev);
  };

  if (owCommitteeIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col items-center justify-center">
      <SimpleTitle title="Ny opptaksperiode" />

      <div className="flex flex-col items-center w-full py-10">
        <TextInput
          label="Navn"
          defaultValue={periodData.name}
          placeholder="Eksempel: Suppleringsopptak vår 2025"
          updateInputValues={(value: string) =>
            setPeriodData({
              ...periodData,
              name: value,
            })
          }
        />
        <div className="w-full max-w-xs">
          <TextAreaInput
            label="Beskrivelse"
            placeholder="Flere komiteer søker nye medlemmer til suppleringsopptak. Har du det som trengs? Søk nå og bli en del av vårt fantastiske miljø!
            "
            updateInputValues={(value: string) =>
              setPeriodData({
                ...periodData,
                description: value,
              })
            }
          />
        </div>

        <DatePickerInput
          label="Søknadsperiode"
          updateDates={updateApplicationPeriodDates}
        />
        <DatePickerInput
          label="Intervjuperiode"
          updateDates={updateInterviewPeriodDates}
        />

        {owCommitteeIsLoading ? (
          <div className="animate-pulse">Laster komiteer...</div>
        ) : (
          <div>
            <CheckboxInput
              updateInputValues={(selectedValues: string[]) => {
                setPeriodData({
                  ...periodData,
                  committees: selectedValues,
                });
              }}
              label="Velg komiteer"
              values={availableCommittees}
              order={1}
              required
            />
            <CheckboxInput
              updateInputValues={(selectedValues: string[]) => {
                setPeriodData({
                  ...periodData,
                  optionalCommittees: selectedValues,
                });
              }}
              order={2}
              label="Velg valgfrie komiteer"
              values={availableCommittees}
              info=" Valgfrie komiteer er komiteene som søkere kan velge i
                    tillegg til de maksimum 3 komiteene de kan søke på.
                    Eksempelvis: FeminIT"
            />
          </div>
        )}
      </div>
      <div>
        <div className="flex gap-5 pb-10">
          <Button
            title={showPreview ? "Skjul forhåndsvisning" : "Se forhåndsvisning"}
            color="white"
            onClick={handlePreviewPeriod}
          />
          <Button
            title="Opprett opptaksperiode"
            color="blue"
            onClick={handleAddPeriod}
          />
        </div>
      </div>
      {showPreview && (
        <div className="w-full max-w-lg p-5 mx-auto mt-5 border border-gray-200 rounded-lg shadow dark:border-gray-700">
          <ApplicationForm
            applicationData={periodData}
            setApplicationData={() => {}}
            availableCommittees={
              (periodData.committees?.filter(Boolean) as string[]) || []
            }
            optionalCommittees={
              (periodData.optionalCommittees?.filter(Boolean) as string[]) || []
            }
            getCommitteeDisplayName={getCommitteeDisplayName}
          />
        </div>
      )}
    </div>
  );
};

export default NewPeriod;
