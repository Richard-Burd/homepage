// this file generates the /sitemap.xml file

import type { MetadataRoute } from 'next'

import { routing } from '@/i18n/routing'
import {
  INDEXABLE_PATHNAMES,
  languageAlternates,
  localizedUrl,
} from '@/lib/seo'

// the paths that are indexed by the crawler
// are defined in the INDEXABLE_PATHNAMES array
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHNAMES.flatMap((pathname) => {
    const languages = languageAlternates(pathname)
    return routing.locales.map((locale) => ({
      url: localizedUrl(locale, pathname),
      alternates: { languages },
    }))
  })
}
