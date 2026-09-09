import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { FaImage } from 'react-icons/fa'

import FlyingWingDesktopImage from '@/components/FlyingWingDesktopImage'
import { assetUrl, proxiedAssetUrl } from '@/lib/assets'

type Props = {
  params: Promise<{ locale: string }>
}

const figureClassName = 'my-6 h-auto w-full'
const downloadLinkClassName =
  'inline-flex items-center gap-3 text-zinc-800 transition-opacity hover:opacity-70 dark:text-zinc-50'
const columnClassName =
  'w-full max-w-3xl bg-white px-4 text-[1.0rem] leading-relaxed md:text-[1.125rem] dark:bg-black'

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'FlyingWingPage' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function FlyingWingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('FlyingWingPage')

  const headingClass =
    locale === 'ar'
      ? 'font-(family-name:--font-arabic) font-bold tracking-wider'
      : locale === 'he'
        ? 'font-(family-name:--font-hebrew) font-bold'
        : 'font-(family-name:--font-roboto) font-bold tracking-wide'

  const pngHref = proxiedAssetUrl('flying-wing-desktop.2.png')

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-200 dark:bg-zinc-800">
      <article className="flex w-full flex-1 flex-col items-center">
        <div className={`${columnClassName} pt-32`}>
          <h1
            className={`${headingClass} mb-8 text-center text-3xl text-zinc-700 min-[800px]:text-[2.625rem] min-[800px]:leading-tight dark:text-zinc-50`}
          >
            {t('title')}
          </h1>
        </div>

        <FlyingWingDesktopImage
          src={assetUrl('flying-wing-desktop.2.png')}
          alt={t('imageAlt')}
          expandLabel={t('expandImage')}
          shrinkLabel={t('shrinkImage')}
        />

        <div className={`${columnClassName} flex flex-1 flex-col pb-32`}>
          <Image
            src={assetUrl('flying-wing-mobile.2.png')}
            alt={t('imageAlt')}
            width={1449}
            height={3000}
            className={`${figureClassName} min-[800px]:hidden`}
            priority
          />

          <a
            href={pngHref}
            download="flying-wing.png"
            className={`${downloadLinkClassName} mt-2`}
          >
            <FaImage aria-hidden className="size-7 shrink-0" />
            <span>{t('downloadPng')}</span>
          </a>
        </div>
      </article>
    </div>
  )
}
