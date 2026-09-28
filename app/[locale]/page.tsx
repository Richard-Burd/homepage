import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import PieAndBarCharts from '@/components/pie-and-bar-chart-combo/PieAndBarCharts'
import GazeboWithTwoOppositePortals from '@/components/scenes/GazeboWithTwoOppositePortals'
import ScrollToHash from '@/components/ScrollToHash'
// import RotatingBlenderTestObject from '@/components/scenes/RotatingBlenderTestObject'
// import RotatingCube from '@/components/RotatingCube'
import TechStackBar from '@/components/tech-stack-bar/TechStackBar'
import { Link } from '@/i18n/navigation'
import domainsChartData from '@/data/knowledge-domains-chart.json'
import capabilitiesChartData from '@/data/core-capabilities-chart.json'
import fullStackWebDevStackData from '@/data/full-stack-web-dev-stack.json'
import digitalDesignCreativeToolsStackData from '@/data/digital-design-creative-tools-stack.json'
import aviationStuffStackData from '@/data/aviation-stuff-stack.json'
import { assetUrl } from '@/lib/assets'

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
    description: tDomains.rich(`slices.${slice.id}.Description`, {
      kurdistan: (chunks) => (
        <Link
          href="/kurdistan"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </Link>
      ),
      flyingWing: (chunks) => (
        <Link
          href="/flying-wing"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </Link>
      ),
      urbanCruiseShip: (chunks) => (
        <a
          href="https://www.urbancruiseship.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </a>
      ),
      schematicVisualization: (chunks) => (
        <Link
          href="/schematic-visualization"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </Link>
      ),
    }),
    value: slice.value,
    color: slice.color,
  }))

  const capabilitiesChart = capabilitiesChartData.slices.map((slice) => ({
    id: slice.id,
    label: tCapabilities(`slices.${slice.id}.title`),
    description: tCapabilities.rich(`slices.${slice.id}.Description`, {
      schematicVisualization: (chunks) => (
        <Link
          href="/schematic-visualization"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </Link>
      ),
      flatironSchool: (chunks) => (
        <a
          href="https://flatironschool.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </a>
      ),
      sketchupPortfolio: (chunks) => (
        <a
          href="https://3dwarehouse.sketchup.com/by/richardburd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </a>
      ),
      bespokeCode: (chunks) => (
        <a
          href="https://richard-burd.github.io/longest_common_subsequence"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </a>
      ),
      b: (chunks) => <b>{chunks}</b>,
      i: (chunks) => <i>{chunks}</i>,
      technicalTopics: (chunks) => (
        <a
          href="https://richard-burd.github.io/when_big_o_does_and_does_not_matter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </a>
      ),
      technologyStack: (chunks) => (
        <Link
          href={{ pathname: '/', hash: 'technology-stack' }}
          className="text-blue-600 underline dark:text-blue-400"
        >
          {chunks}
        </Link>
      ),
    }),
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
      <ScrollToHash />
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
          <p className="mx-4 mt-6 text-[1.0rem] md:mx-20 md:text-[1.4rem]">
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
          <p className="mx-4 mt-6 text-[1.0rem] sm:text-justify md:mx-20 md:text-[1.4rem]">
            {t('contactIntro')}
          </p>
          <Image
            src={assetUrl('gmail-email-address.jpg')}
            alt={t('emailImageAlt')}
            width={344}
            height={98}
            className="mx-4 mt-4 mb-40 px-4"
          />
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
              <p className="text-[0.9rem] italic md:text-[1.4rem] md:text-zinc-400">
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
      </main>
    </div>
  )
}
