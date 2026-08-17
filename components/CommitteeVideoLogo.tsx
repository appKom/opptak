/**
 * MIDLERTIDIG KOMPONENT — promovideoer for komiteer i opptaksperioden.
 *
 * Alt som hører til promovideoene bor i denne filen. For å fjerne funksjonen:
 *   1. Slett denne filen
 *   2. I components/CommitteeAboutCard.tsx: fjern importen og bytt
 *      <CommitteeVideoLogo ... /> tilbake til den opprinnelige <img>-en
 *      (den står ordrett i no-video-grenen under, klar til å kopieres).
 *
 * For å legge til en video: legg inn en linje i COMMITTEE_VIDEOS under, med
 * komiteens forkortelse (nøyaktig slik den står i OW) og en YouTube-link.
 * Videoene kan være "Unlisted", men ikke "Privat" (private kan ikke embeddes).
 *
 * Logoen blir spillbar (ring + play-knapp) for alle komiteer som har en
 * video her, uavhengig av opptaksperiode — ellers rendres vanlig logo,
 * identisk med slik kortet så ut før.
 */
import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { OwGroup } from "../lib/types/types";

const COMMITTEE_VIDEOS: Record<string, string> = {
  // Format — Forkortelse: "YouTube-link" (takler watch?v=, youtu.be/ og shorts/)
  Appkom: "https://youtube.com/shorts/KZdBV9jJrzw",
  Dotkom: "https://www.youtube.com/shorts/pIf2iqW3_IU",
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? match[1] : null;
};

interface CommitteeVideoLogoProps {
  committee: OwGroup;
}

const CommitteeVideoLogo = ({ committee }: CommitteeVideoLogoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const videoUrl = COMMITTEE_VIDEOS[committee.abbreviation];
  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  // Den opprinnelige logoen fra CommitteeAboutCard — uendret utseende når
  // komiteen ikke har video eller opptaket er over.
  if (!videoId) {
    return (
      <img
        src={committee.imageUrl || "/Online_svart_o.svg"}
        alt={committee.name}
        className="w-16 h-16 p-1 mb-2 bg-white rounded-full md:w-24 md:h-24"
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative mb-2 transition-transform hover:scale-105"
        aria-label={`Se promovideo fra ${committee.name}`}
      >
        <div className="p-[3px] rounded-full bg-gradient-to-tr from-online-orange to-online-darkTeal">
          <img
            src={committee.imageUrl || "/Online_svart_o.svg"}
            alt={committee.name}
            className="object-cover w-16 h-16 p-1 bg-white border-2 border-white rounded-full md:w-24 md:h-24 dark:border-gray-900"
          />
        </div>
        <div className="absolute bottom-0 right-0 flex items-center justify-center w-6 h-6 text-white border-2 border-white rounded-full bg-online-darkTeal dark:border-gray-900 md:w-7 md:h-7">
          <PlayIcon className="w-3 h-3 ml-0.5 md:w-3.5 md:h-3.5" />
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-[420px] aspect-[9/16] max-h-[85vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-0 text-white -top-10 hover:text-gray-300"
              aria-label="Lukk video"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
              title={`Promovideo fra ${committee.name}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full bg-black rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CommitteeVideoLogo;
