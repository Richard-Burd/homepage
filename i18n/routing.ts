import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ar', 'he'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
