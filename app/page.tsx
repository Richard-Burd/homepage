import RotatingCube from "@/components/RotatingCube";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { SiSketchup } from "react-icons/si";

const socialLinks = [
  {
    href: "https://www.linkedin.com/in/richardburd/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
  {
    href: "https://3dwarehouse.sketchup.com/by/richardburd",
    label: "SketchUp 3D Warehouse",
    Icon: SiSketchup,
  },
  {
    href: "https://github.com/Richard-Burd",
    label: "GitHub",
    Icon: FaGithub,
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Richard Burd Homepage.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This is the new 3D homepage.
          </p>
          <RotatingCube />
        </div>
        <nav
          aria-label="Social links"
          className="flex flex-row items-center gap-6"
        >
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="transition-opacity hover:opacity-70"
            >
              <Icon size={28} color="#698fb5" />
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
