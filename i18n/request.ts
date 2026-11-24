import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { locale as readRootLocale } from 'next/root-params'
import { notFound } from 'next/navigation'

import { routing } from './routing'

export default getRequestConfig(async ({ locale: localeOverride }) => {
  let locale = localeOverride

  if (!locale) {
    const paramValue = await readRootLocale()
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue
    } else {
      notFound()
    }
  }

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})