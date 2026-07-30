import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Geist, Geist_Mono, Noto_Sans_Arabic, Noto_Sans_Hebrew } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { routing, type Locale } from '@/i18n/routing'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoArabic = Noto_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '600'],
})

const notoHebrew = Noto_Sans_Hebrew({
  variable: '--font-hebrew',
  subsets: ['hebrew'],
  weight: ['400', '600'],
})

const rtlLocales: Locale[] = ['ar', 'he']

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Omit<Props, 'children'>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://richardburd.dev',
      images: [
        {
          url: 'https://richard-burd-homepage.s3.us-east-1.amazonaws.com/open-graph-image.jpg',
          width: 1200,
          height: 630,
          alt: t('ogAlt'),
        },
      ],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const isRtl = rtlLocales.includes(locale as Locale)
  const localeFont =
    locale === 'ar'
      ? notoArabic.variable
      : locale === 'he'
        ? notoHebrew.variable
        : ''

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${geistSans.variable} ${geistMono.variable} ${localeFont} h-full antialiased`}
    >
      <body
        className={`flex min-h-full flex-col ${
          locale === 'ar'
            ? 'font-(family-name:--font-arabic)'
            : locale === 'he'
              ? 'font-(family-name:--font-hebrew)'
              : 'font-sans'
        }`}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
