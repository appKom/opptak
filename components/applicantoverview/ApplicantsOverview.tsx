import { useEffect, useState, useRef } from "react";
import {
  applicantType,
  bankomOptionsType,
  periodType,
} from "../../lib/types/types";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import ApplicantOverviewSkeleton from "../skeleton/ApplicantOverviewSkeleton";
import { useQuery } from "@tanstack/react-query";
import {
  fetchApplicantsByPeriodId,
  fetchApplicantsByPeriodIdAndCommittee,
} from "../../lib/api/applicantApi";
import ErrorPage from "../ErrorPage";
import ApplicantCard from "./ApplicantCard";
import { SimpleTitle } from "../Typography";
import { isPreferencesType } from "../../lib/utils/validators";

interface Props {
  period?: periodType | null;
  committees?: string[] | null;
  committee?: string;
  includePreferences: boolean;
  showPeriodName?: boolean;
}

const ApplicantsOverview = ({
  period,
  committees,
  committee,
  includePreferences,
  showPeriodName,
}: Props) => {
  const [filteredApplicants, setFilteredApplicants] = useState<applicantType[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBankom, setSelectedBankom] =
    useState<bankomOptionsType>(undefined);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const [applicants, setApplicants] = useState<applicantType[]>([]);
  const years: string[] = ["1", "2", "3", "4", "5"];

  const bankomOptions: bankomOptionsType[] = ["ja", "nei", "kanskje"];

  const {
    data: applicantsData,
    isError: applicantsIsError,
    isLoading: applicantsIsLoading,
  } = useQuery({
    queryKey: ["applicants", period?._id, committee],
    queryFn: includePreferences
      ? fetchApplicantsByPeriodId
      : fetchApplicantsByPeriodIdAndCommittee,
  });

  useEffect(() => {
    if (!applicantsData) return;

    const dataType = includePreferences
      ? applicantsData.applications
      : applicantsData.applicants;

    setApplicants(dataType);
  }, [applicantsData, includePreferences]);

  useEffect(() => {
    let filtered: applicantType[] = applicants;

    if (selectedCommittee) {
      filtered = filtered.filter((applicant) => {
        if (isPreferencesType(applicant.preferences)) {
          return (
            applicant.preferences.first.toLowerCase() ===
              selectedCommittee.toLowerCase() ||
            applicant.preferences.second.toLowerCase() ===
              selectedCommittee.toLowerCase() ||
            applicant.preferences.third.toLowerCase() ===
              selectedCommittee.toLowerCase() ||
            applicant.optionalCommittees.some(
              (optionalCommittee) =>
                optionalCommittee.toLowerCase() ===
                selectedCommittee.toLowerCase(),
            )
          );
        }
      });
    }

    if (selectedYear) {
      filtered = filtered.filter(
        (applicant) => applicant.grade.toString() === selectedYear,
      );
    }

    if (selectedBankom) {
      filtered = filtered.filter(
        (applicant) => applicant.bankom === selectedBankom,
      );
    }

    if (searchQuery) {
      const regex = new RegExp(searchQuery.split("").join(".*"), "i");
      filtered = filtered.filter((applicant) => regex.test(applicant.name));
    }

    setFilteredApplicants(filtered);
  }, [
    selectedCommittee,
    selectedYear,
    searchQuery,
    selectedBankom,
    applicants,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCommittee(null);
    setSelectedYear("");
    setSelectedBankom(undefined);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).classList.contains("filter-icon")
      ) {
        setFilterMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterMenuRef]);

  if (applicantsIsLoading) return <ApplicantOverviewSkeleton />;
  if (applicantsIsError) return <ErrorPage />;

  return (
    <div className="flex flex-col items-center px-5">
      {showPeriodName && <SimpleTitle title={period?.name || ""} />}

      <div className="w-full max-w-lg mx-auto mt-10 mb-5">
        <div className="relative flex flex-row justify-between mb-2 align-end">
          <p className="text-sm text-gray-800 dark:text-gray-300">
            Søk etter navn eller filtrer
          </p>
          <div className="flex flex-row gap-2 relative">
            {applicants.length > filteredApplicants.length && (
              <p
                className="text-blue-800 dark:text-blue-400 text-sm cursor-pointer"
                onClick={resetFilters}
              >
                (Vis alle {applicants.length})
              </p>
            )}
            <AdjustmentsHorizontalIcon
              className={`w-8 h-8 cursor-pointer transition-transform duration-300 transform filter-icon ${
                filterMenuVisible ? "rotate-180" : "rotate-0"
              }`}
              onClick={() => setFilterMenuVisible(!filterMenuVisible)}
            />
            {filterMenuVisible && (
              <div
                ref={filterMenuRef}
                className="absolute right-0 top-10 w-48 bg-white dark:bg-online-darkBlue border border-gray-300 dark:border-gray-600 p-4 rounded shadow-lg z-10"
              >
                {committees && (
                  <div className="mb-4">
                    <label className="block text-sm mb-2">Velg komite</label>
                    <select
                      className="w-full p-2 border text-black border-gray-300 dark:bg-online-darkBlue dark:text-white dark:border-gray-600"
                      value={selectedCommittee ?? ""}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                    >
                      <option value="">Velg komite</option>
                      {committees.map((committee, index) => (
                        <option key={index} value={committee}>
                          {committee}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm mb-2">Velg klasse</label>
                  <select
                    className="w-full p-2 border text-black border-gray-300 dark:bg-online-darkBlue dark:text-white dark:border-gray-600"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">Velg klasse</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}. Klasse
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Velg bankom</label>
                  <select
                    className="w-full p-2 border text-black border-gray-300 dark:bg-online-darkBlue dark:text-white dark:border-gray-600"
                    value={selectedBankom}
                    onChange={(e) =>
                      setSelectedBankom(e.target.value as bankomOptionsType)
                    }
                  >
                    <option value="">Velg bankom</option>
                    {bankomOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="Ola Nordmann"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-black border-gray-300 dark:bg-online-darkBlue dark:text-white dark:border-gray-600"
        />
      </div>

      {filteredApplicants && filteredApplicants.length > 0 ? (
        <div className="w-full max-w-lg mx-auto">
          <div className="flex flex-col ">
            {filteredApplicants?.map((applicant) => (
              <ApplicantCard
                key={applicant._id.toString()}
                applicant={applicant}
                includePreferences={includePreferences}
              />
            ))}
            <p className="text-end ">{filteredApplicants?.length} resultater</p>
          </div>
        </div>
      ) : (
        <p>Ingen søkere</p>
      )}
    </div>
  );
};

export default ApplicantsOverview;
