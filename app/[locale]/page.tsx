import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import { SiSketchup } from 'react-icons/si'

import DomainsPieChart from '@/components/DomainsPieChart'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import RotatingCube from '@/components/RotatingCube'
import ThemeToggle from '@/components/ThemeToggle'
import domainsPieData from '@/data/domains-pie.json'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/in/richardburd/',
    labelKey: 'linkedin' as const,
    Icon: FaLinkedinIn,
  },
  {
    href: 'https://3dwarehouse.sketchup.com/by/richardburd',
    labelKey: 'sketchup' as const,
    Icon: SiSketchup,
  },
  {
    href: 'https://github.com/Richard-Burd',
    labelKey: 'github' as const,
    Icon: FaGithub,
  },
]

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('HomePage')
  const tDomains = await getTranslations('DomainsPie')

  const pieData = domainsPieData.map((slice) => ({
    id: slice.id,
    label: tDomains(`slices.${slice.id}`),
    value: slice.value,
    color: slice.color,
  }))

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-8 py-32 sm:items-start dark:bg-black">
        <div className="mb-8 flex w-full items-center gap-3 sm:mb-0">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-start">
          <h1
            className={`leading-10 text-zinc-700 dark:text-zinc-50 ${
              locale === 'ar'
                ? 'font-(family-name:--font-arabic) text-[1.7rem] font-bold tracking-wider'
                : locale === 'he'
                  ? 'font-(family-name:--font-hebrew) text-[2rem] font-bold'
                  : 'font-(family-name:--font-roboto) text-3xl font-bold tracking-wide'
            }`}
          >
            {t('title')}
          </h1>
          <p
            className={`max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400 ${
              locale === 'ar'
                ? 'font-(family-name:--font-arabic) font-normal'
                : locale === 'he'
                  ? 'font-(family-name:--font-hebrew) font-normal'
                  : 'font-(family-name:--font-roboto) font-normal'
            }`}
          >
            {t('subtitle')}
          </p>
          <RotatingCube />
          <DomainsPieChart data={pieData} />
        </div>
        <div className="mt-6">
          <Image
            src="https://richard-burd-homepage.s3.us-east-1.amazonaws.com/columbia-test-image.jpg"
            alt={t('imageAlt')}
            width={800}
            height={600}
            priority
          />
        </div>

        <nav
          aria-label={t('socialNav')}
          className="mt-6 flex flex-row items-center gap-6"
        >
          {socialLinks.map(({ href, labelKey, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(labelKey)}
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
