import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { assetUrl } from '@/lib/assets'

export const SITE_URL = 'https://www.richardburd.dev'

/**
 * Public, indexable routes. Every entry must exist for every locale in
 * `routing.locales`. Do not add noindex or password-protected routes here.
 */
export const INDEXABLE_PATHNAMES = [
  '/',
  '/kurdistan',
  '/flying-wing',
  '/schematic-visualization',
  '/contact-resume',
] as const

// this is the type of the indexable pathnames
export type IndexablePathname = (typeof INDEXABLE_PATHNAMES)[number]

// this function converts a locale to a valid locale
function toLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
}

/** Absolute production URL for `pathname` in `locale`, following next-intl prefixing. */
export function localizedUrl(locale: string, pathname: IndexablePathname) {
  const path = getPathname({ locale: toLocale(locale), href: pathname })
  return new URL(path, SITE_URL).toString()
}

/** hreflang map for `pathname`, including `x-default` (the default locale). */
export function languageAlternates(pathname: IndexablePathname) {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, pathname)
  }
  languages['x-default'] = localizedUrl(routing.defaultLocale, pathname)
  return languages
}

export function openGraphImages(alt: string) {
  return [
    {
      url: assetUrl('open-graph-image.3.jpg'),
      width: 1200,
      height: 630,
      alt,
    },
  ]
}

type PageMetadataOptions = {
  locale: string
  pathname: IndexablePathname
  title: string
  description: string
}

/**
 * Metadata for an indexable page: self-referencing canonical, hreflang
 * alternates, and a full `openGraph` object (metadata merges shallowly, so a
 * page's `openGraph` replaces the layout's entirely).
 */
export async function pageMetadata({
  locale,
  pathname,
  title,
  description,
}: PageMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const url = localizedUrl(locale, pathname)

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url,
      images: openGraphImages(t('ogAlt')),
    },
  }
}
