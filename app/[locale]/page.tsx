import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { BiLogoVenmo } from 'react-icons/bi'
import {
  FaGithub,
  FaInstagramSquare,
  FaLinkedinIn,
  FaMusic,
  FaPaypal,
  FaRedditSquare,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiSketchup } from 'react-icons/si'

import PieAndBarCharts from '@/components/pie-and-bar-chart-combo/PieAndBarCharts'
import GazeboWithTwoOppositePortals from '@/components/scenes/GazeboWithTwoOppositePortals'
// import RotatingBlenderTestObject from '@/components/scenes/RotatingBlenderTestObject'
// import RotatingCube from '@/components/RotatingCube'
import domainsChartData from '@/data/knowledge-domains-chart.json'
import capabilitiesChartData from '@/data/core-capabilities-chart.json'
import { assetUrl } from '@/lib/assets'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/in/richardburd/',
    labelKey: 'linkedin' as const,
    Icon: FaLinkedinIn,
  },
  {
    href: 'https://www.instagram.com/richard.a.burd/',
    labelKey: 'instagram' as const,
    Icon: FaInstagramSquare,
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
  {
    href: 'https://audius.co/richardburd',
    labelKey: 'audius' as const,
    Icon: FaMusic,
  },
  {
    href: 'https://www.paypal.com/biz/profile/RichardBurdOR',
    labelKey: 'paypal' as const,
    Icon: FaPaypal,
  },
  {
    href: 'https://account.venmo.com/u/Richard-A-Burd',
    labelKey: 'venmo' as const,
    Icon: BiLogoVenmo,
  },
  {
    href: 'https://x.com/Richard_A_Burd',
    labelKey: 'x' as const,
    Icon: FaXTwitter,
  },
  {
    href: 'https://www.reddit.com/user/Richard-Burd/',
    labelKey: 'reddit' as const,
    Icon: FaRedditSquare,
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
  const tCapabilities = await getTranslations('CapabilitiesPie')

  const domainsChart = domainsChartData.slices.map((slice) => ({
    id: slice.id,
    label: tDomains(`slices.${slice.id}`),
    value: slice.value,
    color: slice.color,
  }))

  const capabilitiesChart = capabilitiesChartData.slices.map((slice) => ({
    id: slice.id,
    label: tCapabilities(`slices.${slice.id}`),
    value: slice.value,
    color: slice.color,
  }))

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-4 py-32 sm:items-start dark:bg-black">
        <div className="flex w-full flex-col items-center gap-6 text-center">
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
            className={`max-w-md text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400 ${
              locale === 'ar'
                ? 'font-(family-name:--font-arabic) font-normal'
                : locale === 'he'
                  ? 'font-(family-name:--font-hebrew) font-normal'
                  : 'font-(family-name:--font-roboto) font-normal'
            }`}
          >
            {t('subtitle')}
          </p>
        </div>

        <div className="flex w-full items-center justify-center">
          {/* <RotatingCube /> */}
        </div>

        <div className="flex w-full items-center justify-center">
          <GazeboWithTwoOppositePortals />
        </div>

        {/* <div className="flex w-full items-center justify-center">
          <RotatingBlenderTestObject />
        </div> */}

        <div className="flex w-full flex-col items-center gap-40 text-center sm:items-start sm:text-start">
          <PieAndBarCharts
            data={domainsChart}
            pieOrder={domainsChartData.pieOrder}
            title={tDomains('title')}
          />
          <PieAndBarCharts
            data={capabilitiesChart}
            pieOrder={capabilitiesChartData.pieOrder}
            title={tCapabilities('title')}
          />
        </div>

        <div className="mt-6">
          <Image
            src={assetUrl('columbia-test-image.jpg')}
            alt={t('imageAlt')}
            width={800}
            height={600}
            priority
          />
        </div>

        {locale === 'he' ? (
          <div className="mt-6">
            <Image
              src={assetUrl('ketubah-test-image.jpg')}
              alt={t('ketubahImageAlt')}
              width={800}
              height={1100}
            />
          </div>
        ) : null}

        <nav
          aria-label={t('socialNav')}
          className="mx-4 mt-6 flex flex-row flex-wrap items-center gap-6"
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
