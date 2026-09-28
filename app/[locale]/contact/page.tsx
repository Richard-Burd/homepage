import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { assetUrl } from '@/lib/assets'

type Props = {
  params: Promise<{ locale: string }>
}

const columnClassName =
  'w-full max-w-3xl bg-white px-4 text-[1.0rem] leading-relaxed md:text-[1.4rem] dark:bg-black'

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ContactPage' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ContactPage')

  const headingClass =
    locale === 'ar'
      ? 'font-(family-name:--font-arabic) font-bold tracking-wider'
      : locale === 'he'
        ? 'font-(family-name:--font-hebrew) font-bold'
        : 'font-(family-name:--font-roboto) font-bold tracking-wide'

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-200 dark:bg-zinc-800">
      <main
        className={`${columnClassName} flex flex-1 flex-col items-center py-32 text-center sm:text-start`}
      >
        <h1
          className={`${headingClass} mb-8 text-3xl text-zinc-700 min-[800px]:text-[2.625rem] min-[800px]:leading-tight dark:text-zinc-50`}
        >
          {t('title')}
        </h1>
        <p className="mx-4 sm:text-justify md:mx-20">{t('intro')}</p>
        <Image
          src={assetUrl('gmail-email-address.jpg')}
          alt={t('emailImageAlt')}
          width={344}
          height={98}
          className="mx-4 mt-4 px-4"
        />
      </main>
    </div>
  )
}
