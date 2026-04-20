import { UserIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import AdminIcon from "../components/icons/icons/AdminIcon";
import { StepByStep } from "../components/StepByStep";

const info = [
  {
    icon: <UserIcon className="w-8 h-8 text-red-500" />,
    color: "red",
    title: "Søker",
    content: [
      "Velg riktig opptaksperiode.",
      "Fyll inn søknad for opptaket og velg når du kan intervjues.",
      "Send inn søknad og motta bekreftelse på e-post.",
      "Motta SMS og e-post om innkalling til intervjuer når søknadsfristen er over.",
    ],
  },
  {
    icon: <UserGroupIcon className="w-8 h-8 text-blue-500" />,
    color: "blue",
    title: "Komitémedlem",
    content: [
      "Velg riktig opptaksperiode.",
      "Legg inn intervjutider for komiteen din innen søknadsfristen.",
      "Motta e-post om intervjutider for komiteen når søknadsfristen er over.",
    ],
  },
  {
    icon: <AdminIcon className="w-8 h-8 text-yellow-500" />,
    color: "yellow",
    title: "Administrator",
    content: [
      "Opprett opptaksperiode ved å velge datoer og komiteer for opptaket.",
    ],
  },
];

const About = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[90%] md:w-[80%] xl:w-[65%]">
        <h1 className="max-w-2xl mb-10 text-4xl font-bold leading-none tracking-tight md:text-5xl xl:text-6xl dark:text-white">
          Hvordan fungerer opptak.online?
        </h1>

        <p className="max-w-2xl font-light text-gray-500 md:text-lg lg:text-xl dark:text-gray-400">
          Opptaksiden er laget for å gjøre opptak for alle involverte, både
          søkere og komiteer, så enkelt og oversiktlig som mulig.
        </p>

        <div className="flex flex-col justify-between w-full gap-10 mt-6 xl:flex-row lg:mt-16">
          {info.map((item, index) => (
            <div key={index}>
              <StepByStep item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
