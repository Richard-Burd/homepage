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
import TechStackBar from '@/components/tech-stack-bar/TechStackBar'
import domainsChartData from '@/data/knowledge-domains-chart.json'
import capabilitiesChartData from '@/data/core-capabilities-chart.json'
import fullStackWebDevStackData from '@/data/full-stack-web-dev-stack.json'
import digitalDesignCreativeToolsStackData from '@/data/digital-design-creative-tools-stack.json'
import aviationStuffStackData from '@/data/aviation-stuff-stack.json'
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
  const tTechStacks = await getTranslations('TechStacks')
  const tFullStackWebDev = await getTranslations('TechStacks.fullStackWebDev')
  const tDigitalDesignCreativeTools = await getTranslations(
    'TechStacks.digitalDesignCreativeTools'
  )
  const tAviationStuff = await getTranslations('TechStacks.aviationStuff')

  const domainsChart = domainsChartData.slices.map((slice) => ({
    id: slice.id,
    label: tDomains(`slices.${slice.id}.title`),
    description: tDomains(`slices.${slice.id}.Description`),
    value: slice.value,
    color: slice.color,
  }))

  const capabilitiesChart = capabilitiesChartData.slices.map((slice) => ({
    id: slice.id,
    label: tCapabilities(`slices.${slice.id}.title`),
    description: tCapabilities(`slices.${slice.id}.Description`),
    value: slice.value,
    color: slice.color,
  }))

  // Tier 1 & 2 labels are translated; tier-3 tool names stay in Latin script
  // and come straight from the data file. Descriptions for all tiers are
  // translated and appear in the detail panel when a bar is clicked.
  const fullStackWebDevGroups = fullStackWebDevStackData.groups.map(
    (group) => ({
      id: group.id,
      label: tFullStackWebDev(`groups.${group.id}.label`),
      description: tFullStackWebDev(`groups.${group.id}.description`),
      color: group.color,
      items: group.items.map((item) => ({
        ...item,
        description: tFullStackWebDev(`items.${item.id}`),
      })),
    })
  )

  const digitalDesignCreativeToolsGroups =
    digitalDesignCreativeToolsStackData.groups.map((group) => ({
      id: group.id,
      label: tDigitalDesignCreativeTools(`groups.${group.id}.label`),
      description: tDigitalDesignCreativeTools(
        `groups.${group.id}.description`
      ),
      color: group.color,
      items: group.items.map((item) => ({
        ...item,
        description: tDigitalDesignCreativeTools(`items.${item.id}`),
      })),
    }))

  const aviationStuffGroups = aviationStuffStackData.groups.map((group) => ({
    id: group.id,
    label: tAviationStuff(`groups.${group.id}.label`),
    description: tAviationStuff(`groups.${group.id}.description`),
    color: group.color,
    items: group.items.map((item) => ({
      ...item,
      description: tAviationStuff(`items.${item.id}`),
    })),
  }))

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-800">
      <main
        id="home"
        className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-4 py-32 sm:items-start dark:bg-black"
      >
        <div className="flex w-full flex-col items-center gap-6 text-center">
          <h1
            className={`leading-10 text-zinc-700 dark:text-zinc-50 ${
              locale === 'ar'
                ? 'font-(family-name:--font-arabic) text-[1.7rem] font-bold tracking-wider min-[800px]:text-[2.38rem] min-[800px]:leading-tight'
                : locale === 'he'
                  ? 'font-(family-name:--font-hebrew) text-[2rem] font-bold min-[800px]:text-[2.8rem] min-[800px]:leading-tight'
                  : 'font-(family-name:--font-roboto) text-3xl font-bold tracking-wide min-[800px]:text-[2.625rem] min-[800px]:leading-tight'
            }`}
          >
            {t.rich('title', {
              phrase: (chunks) => (
                <span
                  className={
                    locale === 'ar'
                      ? 'block whitespace-nowrap'
                      : 'inline-block whitespace-nowrap'
                  }
                >
                  {chunks}
                </span>
              ),
            })}
          </h1>
        </div>

        <div className="flex w-full items-center justify-center">
          {/* <RotatingCube /> */}
        </div>

        <div className="flex w-full flex-col items-center">
          <GazeboWithTwoOppositePortals />
          <p className="mx-4 mt-6 mb-40 text-[1.0rem] sm:text-justify md:mx-20 md:text-[1.4rem]">
            {t.rich('intro', {
              existingHomepage: (chunks) => (
                <a
                  href="https://richard-burd.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>

        {/* <div className="flex w-full items-center justify-center">
          <RotatingBlenderTestObject />
        </div> */}

        <div className="flex w-full flex-col items-center gap-40 text-center sm:items-start sm:text-start">
          <div id="knowledge-domains" className="w-full scroll-mt-24">
            <PieAndBarCharts
              data={domainsChart}
              pieOrder={domainsChartData.pieOrder}
              title={tDomains('title')}
              subtitle={tDomains('subtitle')}
            />
          </div>
          <div id="core-capabilities" className="w-full scroll-mt-24">
            <PieAndBarCharts
              data={capabilitiesChart}
              pieOrder={capabilitiesChartData.pieOrder}
              title={tCapabilities('title')}
              subtitle={tCapabilities('subtitle')}
            />
          </div>
          <div
            id="technology-stack"
            className="flex w-full scroll-mt-24 flex-col gap-[58.24px]"
          >
            <div className="flex w-full flex-col items-center gap-[5.376px] text-center">
              <h2
                className={`font-bold tracking-wide text-zinc-700 dark:text-zinc-50 ${
                  locale === 'ar'
                    ? 'font-(family-name:--font-arabic) text-[28.8px] min-[800px]:text-[40px]'
                    : locale === 'he'
                      ? 'font-(family-name:--font-hebrew) text-[28.8px] min-[800px]:text-[40px]'
                      : 'font-(family-name:--font-roboto) text-[28.8px] min-[800px]:text-[40px]'
                }`}
              >
                {tTechStacks('sectionTitle')}
              </h2>
              <p className="text-[0.9rem] text-zinc-400 italic md:text-[1.4rem]">
                {tTechStacks('sectionSubtitle')}
              </p>
            </div>
            <TechStackBar
              title={tFullStackWebDev('title')}
              subtitle={tFullStackWebDev('subtitle')}
              color={fullStackWebDevStackData.color}
              groups={fullStackWebDevGroups}
            />
            <TechStackBar
              title={tDigitalDesignCreativeTools('title')}
              subtitle={tDigitalDesignCreativeTools('subtitle')}
              color={digitalDesignCreativeToolsStackData.color}
              groups={digitalDesignCreativeToolsGroups}
            />
            <TechStackBar
              title={tAviationStuff('title')}
              subtitle={tAviationStuff('subtitle')}
              color={aviationStuffStackData.color}
              groups={aviationStuffGroups}
            />
          </div>
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

        {/* {locale === 'he' ? (
          <div className="mt-6">
            <Image
              src={assetUrl('ketubah-test-image.jpg')}
              alt={t('ketubahImageAlt')}
              width={800}
              height={1100}
            />
          </div>
        ) : null} */}

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
