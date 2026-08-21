import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  Geist,
  Geist_Mono,
  Noto_Kufi_Arabic,
  Roboto,
  Rubik,
} from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import Footer from '@/components/Footer'
import { InlineScript } from '@/components/InlineScript'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { routing, type Locale } from '@/i18n/routing'
import { assetUrl } from '@/lib/assets'
import { themeInitScript } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const notoArabic = Noto_Kufi_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
})

const rubik = Rubik({
  variable: '--font-hebrew',
  subsets: ['hebrew'],
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
          url: assetUrl('open-graph-image.3.jpg'),
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

  // Keep <html> className stable across locales so React does not rewrite
  // documentElement.class (and wipe the imperatively applied `dark` class).
  // Locale-specific faces are selected on <body> via font-family.
  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${notoArabic.variable} ${rubik.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body
        className={`flex min-h-full flex-col ${
          locale === 'ar'
            ? 'font-(family-name:--font-arabic)'
            : locale === 'he'
              ? 'font-(family-name:--font-hebrew)'
              : 'font-sans'
        }`}
      >
        <NextIntlClientProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
