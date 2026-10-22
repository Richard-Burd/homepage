// this file is the site map generator

import type { MetadataRoute } from 'next'

import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/seo'

// this is the path that is *not* indexed by the crawler
const portfolioPaths = routing.locales.map((locale) =>
  getPathname({ locale, href: '/schematic-visualization/portfolio' })
)

// the rest of the paths *are* indexed by the crawler
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...portfolioPaths], // not you!
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
