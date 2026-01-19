import {
  Slack,
  Facebook,
  Instagram,
  Github,
  Mail,
  ExternalLink,
  Bug,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../lib/hooks/useTheme";

const footerLinks = [
  { name: "Slack", icon: <Slack />, link: "https://onlinentnu.slack.com/" },
  {
    name: "Facebook",
    icon: <Facebook />,
    link: "https://facebook.com/LinjeforeningenOnline",
  },
  {
    name: "Instagram",
    icon: <Instagram />,
    link: "https://instagram.com/online_ntnu/",
  },
  { name: "Github", icon: <Github />, link: "https://github.com/appKom" },
];

export default function Footer() {
  const theme = useTheme();

  return (
    <footer className="px-4 py-12 mt-24 text-gray-700 bg-zinc-50 border-t border-gray-300 dark:text-gray-300 dark:border-gray-700 md:px-6 lg:px-8 dark:bg-gray-800 relative">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between mb-8 space-y-8 md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-4 md:items-start">
            <h2 className="text-2xl font-bold">Online Opptak</h2>
            <a href="mailto:appkom@online.ntnu.no" className="flex items-center gap-2 transition-colors cursor-pointer hover:text-online-orange">
              <Mail size={18} />
              appkom@online.ntnu.no
            </a>
          </div>

          <a href="https://docs.google.com/forms/d/e/1FAIpQLScvjEqVsiRIYnVqCNqbH_-nmYk3Ux6la8a7KZzsY3sJDbW-iA/viewform"
            target="_blank"
            rel="noreferrer"
            className='flex items-center justify-center h-full gap-3 p-1.5 bg-[#f3f4f6] dark:bg-[#212f4d] rounded-lg max-h-min'>
            <div className="p-1 text-center text-gray-600 dark:text-white">
              <div className="flex items-center justify-center gap-2">
                <p className="font-semibold text-lg">Debug</p>
                <Bug className="w-5" />
              </div>
              <p className="text-sm">Opplevd noe ugreit?</p>
              <p className="text-sm">Trykk her for mer info</p>
            </div>
          </a>

          <div className="flex flex-col items-center space-y-4 md:items-end">
            <div className="flex space-x-4">
              {footerLinks.map((link, index) => (
                <Link href={link.link} key={index} passHref className="transition cursor-pointer hover:text-online-orange" aria-label={link.name}>
                  {link.icon}
                </Link>
              ))}
            </div>
            <div className="text-sm text-center md:text-right">
              <p>Skjedd en feil?</p>
              <a
                href="mailto:appkom@online.ntnu.no"
                className="flex items-center justify-center md:justify-end space-x-1 transition hover:text-online-orange hover:underline"
              >
                <span>Ta kontakt med Appkom</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between py-8 space-y-6 border-t border-gray-300 dark:border-gray-700 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-6">
            <Link href="https://online.ntnu.no/" target="_blank" className="transition hover:opacity-50">
              <Image
                src={theme === "dark" ? "/Online_hvit.svg" : "/Online_bla.svg"}
                alt="Online logo"
                width={128}
                height={34}
              />
            </Link>
            {/* HSP logo */}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Online Opptak
            reservert.
          </p>
        </div>
        <div className="flex justify-end group mb-10 cursor-help">
          <Image
            src="/cappelini/cappelini-gray.svg"
            alt="cappelini"
            width={75}
            height={75}
            className="absolute group-hover:opacity-0 transition-opacity duration-300"
          />
          <Image
            src="/cappelini/cappelini.svg"
            alt="cappelini hover"
            width={75}
            height={75}
            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </footer >
  );
}
