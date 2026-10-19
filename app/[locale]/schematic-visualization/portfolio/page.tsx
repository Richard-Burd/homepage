import { connection } from 'next/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import PortfolioGallery from '@/components/portfolio/PortfolioGallery'
import { routing } from '@/i18n/routing'
import { presignPortfolioImages } from '@/lib/portfolio-images'
import { PORTFOLIO_COOKIE, sessionIsValid } from '@/lib/portfolio-session'

type Props = {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata = {
  title: 'Portfolio',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

function schematicPath(locale: string) {
  if (locale === routing.defaultLocale) return '/schematic-visualization'
  return `/${locale}/schematic-visualization`
}

export default async function PortfolioPage({ params }: Props) {
  await connection()
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const cookieStore = await cookies()
  const returnHref = schematicPath(locale)
  if (!sessionIsValid(cookieStore.get(PORTFOLIO_COOKIE)?.value)) {
    redirect(returnHref)
  }

  const images = await presignPortfolioImages()

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-200 dark:bg-zinc-800">
      <main
        aria-label="Portfolio"
        className="flex w-full max-w-3xl flex-1 flex-col bg-white px-4 pt-(--navbar-height,4.15rem) pb-32 dark:bg-black"
      >
        <PortfolioGallery images={images} returnHref={returnHref} />
      </main>
    </div>
  )
}
