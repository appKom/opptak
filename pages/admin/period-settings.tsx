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
import { fetchCommitteesByPeriodId, fetchOwCommittees } from "../../lib/api/committeesApi";
import ErrorPage from "../../components/ErrorPage";
import { createPeriod, editPeriod } from "../../lib/api/periodApi";
import { SimpleTitle } from "../../components/Typography";
import { getCommitteeDisplayNameFactory } from "../../lib/utils/getCommitteeDisplayNameFactory";
import { fetchApplicantsByPeriodId } from "../../lib/api/applicantApi";

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getChangedFields = (
  original: periodType,
  current: DeepPartial<periodType>
): Partial<periodType> => {
  const changed: Partial<periodType> = {};

  (Object.keys(current) as (keyof periodType)[]).forEach((key) => {
    const originalValue = original[key];
    const currentValue = current[key];

    if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
      changed[key] = currentValue as any;
    }
  });

  return changed;
};

interface Props {
  period?: periodType | null
}

const PeriodSettings = ({ period }: Props) => {
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
    hasMatchedInterviews: false,
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

  const {
    data: owCommitteesData,
    isError: owCommitteesIsError,
    isLoading: owCommitteesIsLoading,
  } = useQuery({
    queryKey: ["ow-committees", period?._id],
    queryFn: fetchCommitteesByPeriodId,
  });

  
  const {
    data: applicantsData,
    isError: applicantsIsError,
    isLoading: applicantsIsLoading,
  } = useQuery({
    queryKey: ["applicants", period?._id],
    queryFn: fetchApplicantsByPeriodId,
  });
  
  const validateChangedInterviewPeriod = (
    changed: DeepPartial<periodType>
  ): boolean => {
    let earliest = new Date(8640000000000000);
    let latest = new Date(0);
    for (const application of applicantsData.applications) {
      if (earliest > new Date(application.selectedTimes[0].start)) {
        earliest = new Date(application.selectedTimes[0].start);
      }
      if (latest < new Date(application.selectedTimes.at(-1).end)) {
        latest = new Date(application.selectedTimes.at(-1).end);
      }
    }

    if ((changed.interviewPeriod?.start && earliest < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && latest > changed.interviewPeriod.end)) {
      return window.confirm("Du har fjernet intervjutider som minst en søker har markert. Dette kan skape problemer. Er du sikker på at du vil fortsette?")
    }
    
    earliest = new Date(8640000000000000);
    latest = new Date(0);
    for (const committee of owCommitteesData.result) {
      if (earliest > new Date(committee.availabletimes.at(0).start)) {
        earliest = new Date(committee.availabletimes.at(0).start);
      }
      if (latest < new Date(committee.availabletimes.at(-1).end)) {
        latest = new Date(committee.availabletimes.at(-1).end);
      }
    }
    
    if ((changed.interviewPeriod?.start && earliest < changed.interviewPeriod.start) || (changed.interviewPeriod?.end && latest > changed.interviewPeriod.end)) {
      return window.confirm("Du har fjernet intervjutider som minst en komite har markert. Dette kan skape problemer. Er du sikker på at du vil fortsette?")
    }

    return true;
  }
  
  const createPeriodMutation = useMutation({
    mutationFn: createPeriod,
    onSuccess: () =>
      queryClient.invalidateQueries({
        // TODO: try to update cache instead
        queryKey: ["periods"],
      }),
  });

  const editPeriodMutation = useMutation({
    mutationFn: editPeriod,
    onSuccess: () => 
      queryClient.invalidateQueries({
        queryKey: ["periods"],
      }),
  });

  useEffect(() => {
    if (!period) return;
    setPeriodData({
      ...period,
      applicationPeriod: {
        start: new Date(period.applicationPeriod.start),
        end: new Date(period.applicationPeriod.end)
      },
      interviewPeriod: {
        start: new Date(period.interviewPeriod.start),
        end: new Date(period.interviewPeriod.end)
      }
    }
    );
  }, [period]);

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
    start: string;
    end: string;
  }) => {
    setPeriodData((prevData) => ({
      ...prevData,
      applicationPeriod: {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
      },
    }));
  };

  const updateInterviewPeriodDates = ({
    start,
    end,
  }: {
    start: string;
    end: string;
  }) => {
    setPeriodData((prevData) => ({
      ...prevData,
      interviewPeriod: {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
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
  

  const handleEditPeriod = async () => {
    if (!validatePeriod(periodData)) return;
    if (!period) return;
    
    const changedFields = getChangedFields(period, periodData);
    
    if (!await validateChangedInterviewPeriod(changedFields)) {
      return;
    }
    
    try {
      editPeriodMutation.mutate({
        _id: period._id,
        ...changedFields,
      } as periodType);
      toast.success("Periode redigert");
    } catch (e) {
      console.error(e);
      toast.error("Noe gikk galt, prøv igjen");
    }
  };

  const handlePreviewPeriod = () => {
    setShowPreview((prev) => !prev);
  };

  
  if (owCommitteeIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col items-center justify-center">
      {period ? <SimpleTitle title="Rediger opptaksperiode" /> : <SimpleTitle title="Ny opptaksperiode" />}

      <div className="flex flex-col items-center w-full py-10">
        <TextInput
          label="Navn"
          defaultValue={periodData.name}
          placeholder="Eksempel: Suppleringsopptak vår 2025"
          updateInputValues={(value: string) => {
              setPeriodData({
                ...periodData,
                name: value,
              })
          }}
        />
        <div className="w-full max-w-xs">
          <TextAreaInput
            label="Beskrivelse"
            placeholder="Flere komiteer søker nye medlemmer til suppleringsopptak. Har du det som trengs? Søk nå og bli en del av vårt fantastiske miljø!
            "
            value={periodData.description}
            updateInputValues={(value: string) => {
              setPeriodData({
                ...periodData,
                description: value,
              })
            }}
          />
        </div>

        <DatePickerInput
          label="Søknadsperiode"
          updateDates={updateApplicationPeriodDates}
          fromDate={
            periodData.applicationPeriod?.start instanceof Date
              ? formatDateForInput(periodData.applicationPeriod.start)
              : undefined
          }
          toDate={
            periodData.applicationPeriod?.end instanceof Date
              ? formatDateForInput(periodData.applicationPeriod.end)
              : undefined
          }
        />
        <DatePickerInput
          label="Intervjuperiode"
          updateDates={updateInterviewPeriodDates}
          fromDate={
            periodData.interviewPeriod?.start instanceof Date
              ? formatDateForInput(periodData.interviewPeriod.start)
              : undefined
          }
          toDate={
            periodData.interviewPeriod?.end instanceof Date
              ? formatDateForInput(periodData.interviewPeriod.end)
              : undefined
          }        />

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
              checkedItems={periodData.committees?.filter(Boolean) as string[]}
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
              checkedItems={periodData.optionalCommittees?.filter(Boolean) as string[]}
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
            title={period ? "Lagre endringer" : "Opprett opptaksperiode"}
            color="blue"
            onClick={period ? handleEditPeriod : handleAddPeriod}
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

export default PeriodSettings;
