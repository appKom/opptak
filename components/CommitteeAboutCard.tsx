import { OwGroup } from "../lib/types/types";
import DOMPurify from 'dompurify';

interface CommitteeAboutCardProps {
  committee: OwGroup;
  hasPeriod: boolean;
  isInterviewing: boolean;
}

const CommitteeAboutCard = ({
  committee,
  hasPeriod,
  isInterviewing,
}: CommitteeAboutCardProps) => (
  <div>
    <img
      src={committee.imageUrl || "/Online_svart_o.svg"}
      alt={committee.name}
      className="w-16 h-16 p-1 mb-2 bg-white rounded-full md:w-24 md:h-24"
    />

    <div className="flex flex-col items-start gap-2 mb-1 md:flex-row md:items-center md:mb-0">
      <h3 className="text-xl font-bold dark:text-white">
        {committee.name}
        {committee.name !== committee.abbreviation &&
          `(${committee.abbreviation})`}
      </h3>
      {hasPeriod && (
        <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 whitespace-nowrap">
          Har opptak!
        </span>
      )}
      {isInterviewing && !hasPeriod && (
        <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
          Intervjuer pågår
        </span>
      )}
    </div>
    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
      {committee.email}
    </p>
    <div
      className="text-gray-500 whitespace-pre-wrap dark:text-gray-400 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300
      "
      dangerouslySetInnerHTML={{ __html: sanitizeCommitteeDescription(committee.description || "Ingen beskrivelse :(") }}
    // dangerouslySetInnerHTML allows for rendering HTML content like images and links
    />
  </div>
);

export default CommitteeAboutCard;

// sanitize committee description to prevent XSS attacks while allowing certain HTML tags
export const sanitizeCommitteeDescription = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'img'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src'],
    ALLOW_DATA_ATTR: false,
  });
};
