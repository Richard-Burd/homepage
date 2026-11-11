'use client'

import { motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { BsFillAirplaneFill } from 'react-icons/bs'
import { GrArticle } from 'react-icons/gr'
import { LuSwords } from 'react-icons/lu'
import { MdOutlineCalculate } from 'react-icons/md'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'

export const ARTICLE_LIBRARY_STYLES = {
  title:
    'text-xl font-bold leading-tight text-zinc-800 sm:text-2xl dark:text-zinc-50',
  subtitle:
    'text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300',
  icon: 'size-14 sm:size-16',
  iconLink:
    'group inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 text-sky-700 shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 dark:border-zinc-600 dark:bg-zinc-900 dark:text-sky-300 dark:focus-visible:ring-offset-black',
} as const

type ArticleKey =
  'schematic' | 'kurdistan' | 'lcs' | 'bigO' | 'flyingWing' | 'foiltrans'

type Article = {
  key: ArticleKey
  Icon: IconType
  href: string | ((locale: Locale) => string)
  external?: boolean
}

const articles: Article[] = [
  {
    key: 'schematic',
    Icon: GrArticle,
    href: (locale) => getPathname({ locale, href: '/schematic-visualization' }),
  },
  {
    key: 'kurdistan',
    Icon: LuSwords,
    href: (locale) => getPathname({ locale, href: '/kurdistan' }),
  },
  {
    key: 'lcs',
    Icon: MdOutlineCalculate,
    href: 'https://richard-burd.github.io/longest_common_subsequence',
    external: true,
  },
  {
    key: 'bigO',
    Icon: MdOutlineCalculate,
    href: 'https://richard-burd.github.io/when_big_o_does_and_does_not_matter',
    external: true,
  },
  {
    key: 'flyingWing',
    Icon: BsFillAirplaneFill,
    href: (locale) => getPathname({ locale, href: '/flying-wing' }),
  },
  {
    key: 'foiltrans',
    Icon: BsFillAirplaneFill,
    href: 'https://github.com/Richard-Burd/foiltrans',
    external: true,
  },
]

export default function ArticleLibraryList() {
  const t = useTranslations('ArticleLibraryPage')
  const locale = useLocale() as Locale
  const reduceMotion = usePrefersReducedMotion()
  const isRtl = locale === 'ar' || locale === 'he'

  const richTextTags = {
    i: (chunks: ReactNode) => <i>{chunks}</i>,
    latin: (chunks: ReactNode) => <bdi dir="ltr">{chunks}</bdi>,
    bigO: (chunks: ReactNode) => (
      <bdi dir="rtl" className="inline-block">
        {chunks}
      </bdi>
    ),
  }

  return (
    <ul className="w-full space-y-5">
      {articles.map(({ key, Icon, href, external }) => {
        const resolvedHref = typeof href === 'function' ? href(locale) : href

        return (
          <li
            key={key}
            className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-5 gap-y-4 px-1 py-4 sm:gap-y-0"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <h2
              className={`${ARTICLE_LIBRARY_STYLES.title} col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
            >
              {t.rich('entries.' + key + '.title', richTextTags)}
            </h2>

            <motion.a
              href={resolvedHref}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              aria-label={t('entries.' + key + '.linkLabel')}
              className={`${ARTICLE_LIBRARY_STYLES.iconLink} col-start-1 row-start-2 sm:row-span-2 sm:row-start-1`}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      scale: 1.08,
                      rotate: -4,
                      y: -3,
                      boxShadow: '0 12px 24px rgba(14, 116, 144, 0.22)',
                    }
              }
              whileTap={
                reduceMotion
                  ? undefined
                  : {
                      scale: 0.9,
                      rotate: 5,
                      boxShadow: '0 2px 6px rgba(14, 116, 144, 0.18)',
                    }
              }
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            >
              <Icon
                aria-hidden
                className={`${ARTICLE_LIBRARY_STYLES.icon} transition-colors duration-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-200`}
              />
            </motion.a>

            <p
              className={`${ARTICLE_LIBRARY_STYLES.subtitle} col-start-2 row-start-2 min-w-0 sm:mt-2`}
            >
              {t.rich('entries.' + key + '.subtitle', richTextTags)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
