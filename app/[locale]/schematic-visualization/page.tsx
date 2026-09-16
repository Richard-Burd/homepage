import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Fragment, type ReactNode } from 'react'

import SchematicArticle, {
  RailEnd,
  RailStart,
} from '@/components/schematic-visualization/SchematicArticle'
import SchematicAssetImage from '@/components/schematic-visualization/SchematicAssetImage'
import {
  getSchematicSections,
  isSchematicImageBlock,
  schematicVisualizationContent,
} from '@/data/schematic-visualization'

type Props = {
  params: Promise<{ locale: string }>
}

const richMarks = {
  b: (chunks: ReactNode) => <strong className="font-bold">{chunks}</strong>,
  i: (chunks: ReactNode) => <em className="italic">{chunks}</em>,
}

function headingClassName(locale: string) {
  if (locale === 'ar') {
    return 'font-(family-name:--font-arabic) font-bold tracking-wider'
  }
  if (locale === 'he') {
    return 'font-(family-name:--font-hebrew) font-bold'
  }
  return 'font-(family-name:--font-roboto) font-bold tracking-wide'
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'SchematicVisualizationPage',
  })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function SchematicVisualizationPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('SchematicVisualizationPage')
  const headingClass = headingClassName(locale)
  const sections = getSchematicSections()

  let rowIndex = 0
  const heroRow = rowIndex++

  return (
    <SchematicArticle
      parallaxSrc={schematicVisualizationContent['parallax-image']}
      parallaxAlt={t('parallaxAlt')}
      parallaxCaption={t('parallaxCaption')}
    >
      <RailStart rowIndex={heroRow} tick>
        <div className="flex flex-col items-center min-[800px]:items-end">
          <h1
            className={`${headingClass} text-center text-3xl min-[800px]:text-end min-[800px]:text-[2.25rem] min-[800px]:leading-tight`}
          >
            {t('title')}
          </h1>
          <p className="mt-3 max-w-md text-center text-sm leading-relaxed min-[800px]:text-end min-[800px]:text-base">
            {t('subtitle')}
          </p>
        </div>
      </RailStart>
      <RailEnd>
        <SchematicAssetImage
          src={schematicVisualizationContent['hero-image']}
          alt={t('heroAlt')}
          caption={t('heroCaption')}
          priority
          minHeightClassName="min-h-[16rem] min-[800px]:min-h-[22rem]"
        />
      </RailEnd>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="contents">
          {section.blocks.map((entry, blockIndex) => {
            const currentRow = rowIndex++
            const showTitle = blockIndex === 0
            const description = isSchematicImageBlock(entry.block)
              ? Boolean(entry.block.hasDescription)
              : false
            const hasLeftContent = showTitle || description

            return (
              <Fragment key={entry.id}>
                <RailStart
                  rowIndex={currentRow}
                  tick={showTitle}
                  align={description && !showTitle ? 'center' : 'start'}
                  hideWhenEmpty={!hasLeftContent}
                >
                  {showTitle ? (
                    <h2
                      className={`${headingClass} text-center text-2xl min-[800px]:text-end min-[800px]:text-[1.75rem] min-[800px]:leading-tight`}
                    >
                      {t(`sections.${section.id}.title`)}
                    </h2>
                  ) : null}
                  {description ? (
                    <div
                      className={`max-w-prose text-start min-[800px]:ms-auto min-[800px]:max-w-66 min-[800px]:text-end ${
                        showTitle ? 'mt-8 min-[800px]:mt-16' : ''
                      }`}
                    >
                      <p
                        className={`${headingClass} text-sm min-[800px]:text-base`}
                      >
                        {t(
                          `sections.${section.id}.${entry.id}.description-title`
                        )}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed min-[800px]:text-[0.95rem]">
                        {t(
                          `sections.${section.id}.${entry.id}.description-text`
                        )}
                      </p>
                    </div>
                  ) : null}
                </RailStart>
                <RailEnd>
                  {entry.block.type === 'paragraph' ? (
                    <p className="bg-sky-100 px-6 py-8 text-[1rem] leading-loose text-zinc-800 md:px-10 md:text-[1.125rem] dark:bg-sky-950 dark:text-zinc-50">
                      {t.rich(`sections.${section.id}.${entry.id}`, richMarks)}
                    </p>
                  ) : (
                    <div className="bg-white px-6 py-6 md:px-10 dark:bg-black">
                      <SchematicAssetImage
                        src={entry.block.location}
                        alt={t(`sections.${section.id}.${entry.id}.alt`)}
                        caption={t(
                          `sections.${section.id}.${entry.id}.caption`
                        )}
                      />
                    </div>
                  )}
                </RailEnd>
              </Fragment>
            )
          })}
        </section>
      ))}
    </SchematicArticle>
  )
}
