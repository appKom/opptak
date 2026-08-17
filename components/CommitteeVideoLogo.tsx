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
 * identisk med slik kortet så ut før. Spillbare logoer sykler rolig gjennom
 * komitélogoen og tre stillbilder fra videoen (YouTubes autogenererte
 * thumbnails, gratis via i.ytimg.com uten API-nøkkel) så det er tydelig at
 * det ligger en video der.
 */
import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { OwGroup } from "../lib/types/types";

const COMMITTEE_VIDEOS: Record<string, string> = {
  // Format — Forkortelse: "YouTube-link" (takler watch?v=, youtu.be/ og shorts/)
  Appkom: "https://youtube.com/shorts/KZdBV9jJrzw"
};

// Hvor lenge hvert bilde står i vekslingen (ms) — logoen står lengst, så
// kortet beholder komiteens identitet.
const LOGO_MS = 2500;
const FRAME_MS = 2500;

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
  // 0 = logo, 1..n = stillbilder fra videoen
  const [slideIndex, setSlideIndex] = useState(0);
  const [failedFrames, setFailedFrames] = useState<string[]>([]);

  const videoUrl = COMMITTEE_VIDEOS[committee.abbreviation];
  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  // YouTubes tre autogenererte stillbilder fra videoen (vertikale for
  // shorts). Frames som feiler å laste filtreres bort — mangler alle
  // (f.eks. vanlig liggende video), står logoen stille.
  const frameUrls = videoId
    ? ["oar1", "oar2", "oar3"]
        .map((variant) => `https://i.ytimg.com/vi/${videoId}/${variant}.jpg`)
        .filter((url) => !failedFrames.includes(url))
    : [];

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

  // Sykler sirkelen gjennom logo → frame 1 → 2 → 3 → logo. Hopper over for
  // brukere med redusert bevegelse i OS-innstillingene.
  useEffect(() => {
    if (frameUrls.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const delay = slideIndex === 0 ? LOGO_MS : FRAME_MS;
    const timeout = setTimeout(
      () => setSlideIndex((prev) => (prev + 1) % (frameUrls.length + 1)),
      delay,
    );
    return () => clearTimeout(timeout);
  }, [slideIndex, frameUrls.length]);

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
          <div className="relative w-16 h-16 overflow-hidden bg-white rounded-full md:w-24 md:h-24">
            <img
              src={committee.imageUrl || "/Online_svart_o.svg"}
              alt={committee.name}
              className={`absolute inset-0 object-cover w-full h-full p-1 bg-white border-2 border-white rounded-full transition-opacity duration-700 dark:border-gray-900 ${
                slideIndex === 0 ? "opacity-100" : "opacity-0"
              }`}
            />
            {frameUrls.map((url, index) => (
              <img
                key={url}
                src={url}
                alt=""
                aria-hidden="true"
                loading="lazy"
                onError={() => {
                  setFailedFrames((prev) => [...prev, url]);
                  setSlideIndex(0);
                }}
                className={`absolute inset-0 object-cover w-full h-full border-2 border-white rounded-full transition-opacity duration-700 dark:border-gray-900 ${
                  slideIndex === index + 1 ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
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
