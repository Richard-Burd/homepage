import type { ReactNode } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import PieAndBarCharts from '@/components/pie-and-bar-chart-combo/PieAndBarCharts'
import GazeboWithTwoOppositePortals from '@/components/scenes/GazeboWithTwoOppositePortals'
import ScrollToHash from '@/components/ScrollToHash'
// import RotatingBlenderTestObject from '@/components/scenes/RotatingBlenderTestObject'
// import RotatingCube from '@/components/RotatingCube'
import TechStackBar from '@/components/tech-stack-bar/TechStackBar'
import domainsChartData from '@/data/knowledge-domains-chart.json'
import capabilitiesChartData from '@/data/core-capabilities-chart.json'
import fullStackWebDevStackData from '@/data/full-stack-web-dev-stack.json'
import digitalDesignCreativeToolsStackData from '@/data/digital-design-creative-tools-stack.json'
import aviationStuffStackData from '@/data/aviation-stuff-stack.json'
import type { Locale } from '@/i18n/routing'
import {
  boldRichTag,
  externalRichLink,
  homeHashRichLink,
  internalRichLink,
  italicRichTag,
  type RichTagMap,
} from '@/lib/rich-text'
import { pageMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

const schematicVisualizationLink = internalRichLink('/schematic-visualization')
const ketubahmakerLink = externalRichLink('https://www.ketubahmaker.com/')
const foiltransRepoLink = externalRichLink(
  'https://github.com/Richard-Burd/foiltrans'
)

const REYNOLDS_NUMBER_WIKI: Record<Locale, string> = {
  en: 'https://en.wikipedia.org/wiki/Reynolds_number',
  ar: 'https://ar.wikipedia.org/wiki/%D8%B9%D8%AF%D8%AF_%D8%B1%D9%8A%D9%86%D9%88%D9%84%D8%AF%D8%B2',
  he: 'https://he.wikipedia.org/wiki/%D7%9E%D7%A1%D7%A4%D7%A8_%D7%A8%D7%99%D7%99%D7%A0%D7%95%D7%9C%D7%93%D7%A1',
}

const domainsPieRichTags: RichTagMap = {
  kurdistan: internalRichLink('/kurdistan'),
  flyingWing: internalRichLink('/flying-wing'),
  urbanCruiseShip: externalRichLink('https://www.urbancruiseship.org/'),
  aviationStuff: homeHashRichLink('aviation-stuff'),
  ketubahmaker: ketubahmakerLink,
  schematicVisualization: schematicVisualizationLink,
}

const capabilitiesPieRichTags: RichTagMap = {
  schematicVisualization: schematicVisualizationLink,
  flatironSchool: externalRichLink('https://flatironschool.com/'),
  sketchupPortfolio: externalRichLink(
    'https://3dwarehouse.sketchup.com/by/richardburd'
  ),
  bespokeCode: externalRichLink(
    'https://richard-burd.github.io/longest_common_subsequence'
  ),
  b: boldRichTag,
  i: italicRichTag,
  technicalTopics: externalRichLink(
    'https://richard-burd.github.io/when_big_o_does_and_does_not_matter'
  ),
  technologyStack: homeHashRichLink('technology-stack'),
}

const digitalDesignItemRichTags: Partial<Record<string, RichTagMap>> = {
  fontforge: { ketubahmaker: ketubahmakerLink },
}

type StackTranslator = {
  (key: string): string
  rich: (key: string, tags: RichTagMap) => ReactNode
}

function reynoldsNumberHref(locale: string) {
  const key: Locale = locale === 'ar' || locale === 'he' ? locale : 'en'
  return REYNOLDS_NUMBER_WIKI[key]
}

function mapTechStackGroups<Item extends { id: string }>(
  groups: Array<{ id: string; color: string; items: Item[] }>,
  t: StackTranslator,
  richTags: {
    groups?: Partial<Record<string, RichTagMap>>
    items?: Partial<Record<string, RichTagMap>>
  } = {}
) {
  function description(key: string, tags?: RichTagMap) {
    return tags ? t.rich(key, tags) : t(key)
  }

  return groups.map((group) => ({
    id: group.id,
    label: t(`groups.${group.id}.label`),
    description: description(
      `groups.${group.id}.description`,
      richTags.groups?.[group.id]
    ),
    color: group.color,
    items: group.items.map((item) => ({
      ...item,
      description: description(`items.${item.id}`, richTags.items?.[item.id]),
    })),
  }))
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return pageMetadata({
    locale,
    pathname: '/',
    title: t('title'),
    description: t('description'),
  })
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
    description: tDomains.rich(
      `slices.${slice.id}.Description`,
      domainsPieRichTags
    ),
    value: slice.value,
    color: slice.color,
  }))

  const capabilitiesChart = capabilitiesChartData.slices.map((slice) => ({
    id: slice.id,
    label: tCapabilities(`slices.${slice.id}.title`),
    description: tCapabilities.rich(
      `slices.${slice.id}.Description`,
      capabilitiesPieRichTags
    ),
    value: slice.value,
    color: slice.color,
  }))

  // Tier 1 & 2 labels are translated; tier-3 tool names stay in Latin script
  // and come straight from the data file. Descriptions for all tiers are
  // translated and appear in the detail panel when a bar is clicked.
  // Rich tags are attached only for ids whose copy contains matching tags.
  const fullStackWebDevGroups = mapTechStackGroups(
    fullStackWebDevStackData.groups,
    tFullStackWebDev
  )

  const digitalDesignCreativeToolsGroups = mapTechStackGroups(
    digitalDesignCreativeToolsStackData.groups,
    tDigitalDesignCreativeTools,
    { items: digitalDesignItemRichTags }
  )

  const reynoldsNumberLink = externalRichLink(reynoldsNumberHref(locale))
  const uavDesignToolsRichTags: RichTagMap = {
    foiltransRepo: foiltransRepoLink,
    reynoldsNumber: reynoldsNumberLink,
  }
  const aviationStuffGroups = mapTechStackGroups(
    aviationStuffStackData.groups,
    tAviationStuff,
    {
      groups: { uavDesignTools: uavDesignToolsRichTags },
      items: { foiltrans: { foiltransRepo: foiltransRepoLink } },
    }
  )

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
          <p className="mx-4 mt-6 mb-40 text-[1.0rem] sm:text-justify md:mx-20 md:text-[1.4rem]">
            {t.rich('intro', {
              existingHomepage: externalRichLink(
                'https://richard-burd.github.io/'
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
            <div id="aviation-stuff" className="scroll-mt-24">
              <TechStackBar
                title={tAviationStuff('title')}
                subtitle={tAviationStuff('subtitle')}
                color={aviationStuffStackData.color}
                groups={aviationStuffGroups}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
