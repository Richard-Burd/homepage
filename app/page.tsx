import RotatingCube from '@/components/RotatingCube'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import { SiSketchup } from 'react-icons/si'

import Image from 'next/image'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/in/richardburd/',
    label: 'LinkedIn',
    Icon: FaLinkedinIn,
  },
  {
    href: 'https://3dwarehouse.sketchup.com/by/richardburd',
    label: 'SketchUp 3D Warehouse',
    Icon: SiSketchup,
  },
  {
    href: 'https://github.com/Richard-Burd',
    label: 'GitHub',
    Icon: FaGithub,
  },
] as const

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl leading-10 font-semibold tracking-tight text-black dark:text-zinc-50">
            Richard Burd Homepage.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This is the new 3D homepage.
          </p>
          <RotatingCube />
        </div>

        <Image
          src="https://richard-burd-homepage.s3.us-east-1.amazonaws.com/columbia-test-image.jpg"
          alt="…"
          width={800}
          height={600}
          priority
        />

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
  )
}
