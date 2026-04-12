import { useState } from "react";
import { applicantType } from "../../lib/types/types";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { changeDisplayName, formatPhoneNumber } from "../../lib/utils/toString";

interface Props {
  applicant: applicantType | undefined;
  includePreferences: boolean;
}

const ApplicantCard = ({ applicant, includePreferences }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const preferences = applicant?.preferences || {};
  const filteredPreferences = Object.entries(preferences).filter(
    ([key, value]) => value,
  );

  return (
    <div className="w-full p-4 my-4 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <div
        onClick={handleToggle}
        className="flex items-center justify-between cursor-pointer"
      >
        <div>
          <h2 className="text-lg font-semibold">{applicant?.name}</h2>
          <p className="text-gray-800 dark:text-gray-300">
            {applicant?.grade}. Klasse
          </p>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform duration-300 transform ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <h1 className="text-lg font-semibold">Kontakt:</h1>
        <p>E-post: {applicant?.email}</p>
        <p>Telefon: {formatPhoneNumber(applicant?.phone || "")}</p>

        {includePreferences && filteredPreferences.length > 0 && (
          <>
            <h1 className="text-lg font-semibold pt-3">
              Prioriterte komitévalg:
            </h1>
            <ul>
              {filteredPreferences.map(([key, value], index) => (
                <li key={index}>{`${index + 1}. ${changeDisplayName(
                  value as string,
                )}`}</li>
              ))}
            </ul>
          </>
        )}

        {applicant?.optionalCommittees && (
          <div className="pt-3">
            <h1 className="text-lg font-semibold">Øvrige komitévalg:</h1>
            <p>
              {applicant?.optionalCommittees
                ?.map(changeDisplayName)
                .join(", ") || "Ingen valg"}{" "}
            </p>
          </div>
        )}

        <h1 className="pt-3 text-lg font-semibold">Om:</h1>
        <p>Ønsker å være økonomiansvarlig: {applicant?.bankom}</p>
        <div className="p-4 mt-2 border-solid border-2 border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="whitespace-pre-wrap">{applicant?.about}</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicantCard;
