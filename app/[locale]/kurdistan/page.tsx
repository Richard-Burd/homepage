import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { FaYoutube } from 'react-icons/fa'

import { assetUrl } from '@/lib/assets'

type Props = {
  params: Promise<{ locale: string }>
}

const linkClassName = 'text-blue-600 underline dark:text-blue-400'

function extLink(href: string) {
  function RichLink(chunks: ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {chunks}
      </a>
    )
  }

  return RichLink
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'KurdistanPage' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function KurdistanPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('KurdistanPage')

  const headingClass =
    locale === 'ar'
      ? 'font-(family-name:--font-arabic) font-bold tracking-wider'
      : locale === 'he'
        ? 'font-(family-name:--font-hebrew) font-bold'
        : 'font-(family-name:--font-roboto) font-bold tracking-wide'

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-800">
      <article className="flex w-full max-w-3xl flex-1 flex-col bg-white px-4 py-32 text-[1.0rem] leading-relaxed md:text-[1.125rem] dark:bg-black">
        <h1
          className={`${headingClass} mb-8 text-center text-3xl text-zinc-700 min-[800px]:text-[2.625rem] min-[800px]:leading-tight dark:text-zinc-50`}
        >
          {t('title')}
        </h1>

        <h2
          className={`${headingClass} mt-4 mb-4 text-xl text-zinc-700 min-[800px]:text-2xl dark:text-zinc-50`}
        >
          {t('abstractHeading')}
        </h2>

        <p className="italic">
          {t.rich('abstract', {
            peshmerga: extLink('https://en.wikipedia.org/wiki/Peshmerga'),
            isis: extLink('https://en.wikipedia.org/wiki/Islamic_State'),
            mosul: extLink('https://youtu.be/KbsesrAMjTw'),
          })}
        </p>

        <p className="my-6">
          <a
            href="https://youtu.be/Dy6FYWNopsE"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('youtubeAria')}
            className="inline-flex items-center transition-opacity hover:opacity-70"
          >
            <FaYoutube size={50} color="#FF0000" aria-hidden />
          </a>
        </p>

        <hr className="my-6 border-zinc-300 dark:border-zinc-700" />
        <hr className="mb-6 border-zinc-300 dark:border-zinc-700" />

        <p>
          {t.rich('p2013', {
            warCrimes: extLink(
              'https://en.wikipedia.org/wiki/Genocide_of_Yazidis_by_ISIL'
            ),
            isisName: extLink(
              'https://en.wikipedia.org/wiki/Islamic_State_of_Iraq_and_the_Levant'
            ),
          })}
        </p>

        <p className="mt-4">{t('pWestern')}</p>

        <Image
          src={assetUrl('kurdistan-fig-0.jpg')}
          alt={t('imageAlt0')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
          priority
          loading="eager"
        />

        <p>{t('pCommanders')}</p>

        <p className="mt-4">{t('pUavReason')}</p>

        <hr className="my-8 border-zinc-300 dark:border-zinc-700" />

        <h2
          className={`${headingClass} mb-4 text-xl text-zinc-700 min-[800px]:text-2xl dark:text-zinc-50`}
        >
          {t('designHeading')}
        </h2>

        <p>{t('pDesign')}</p>

        <p className="mt-4">
          {t.rich('pDummy', {
            dummy: extLink(
              'https://drive.google.com/file/d/1T9fKWgwbUhu5n_UIkCMJMuk2MFkiGEwN/view'
            ),
          })}
        </p>

        <hr className="my-8 border-zinc-300 dark:border-zinc-700" />

        <h2
          className={`${headingClass} mb-4 text-xl text-zinc-700 min-[800px]:text-2xl dark:text-zinc-50`}
        >
          {t('peshwingHeading')}
        </h2>

        <p>
          {t.rich('pPeshwingIntro', {
            peshmerga: extLink('https://en.wikipedia.org/wiki/Peshmerga'),
            krg: extLink(
              'https://en.wikipedia.org/wiki/Kurdistan_Regional_Government'
            ),
            raven: extLink(
              'https://en.wikipedia.org/wiki/AeroVironment_RQ-11_Raven'
            ),
          })}
        </p>

        <Image
          src={assetUrl('kurdistan-fig-1.jpg')}
          alt={t('imageAlt1')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pExpendable')}</p>

        <Image
          src={assetUrl('kurdistan-fig-2.jpg')}
          alt={t('imageAlt2')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pRange')}</p>

        <a
          href="https://drive.google.com/file/d/10ZuGIDeXtm0N71myGmhpH4qinqqLj3C2/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={assetUrl('kurdistan-fig-3.jpg')}
            alt={t('imageAlt3')}
            width={1200}
            height={800}
            className="my-6 h-auto w-full"
          />
        </a>

        <p>
          {t.rich('pSplatsName', {
            splats: (chunks) => (
              <strong>
                <em>{chunks}</em>
              </strong>
            ),
          })}
        </p>

        <Image
          src={assetUrl('kurdistan-fig-4.jpg')}
          alt={t('imageAlt4')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>
          {t.rich('pSplatsDef', {
            spoilers: extLink(
              'https://en.wikipedia.org/wiki/Spoiler_%28aeronautics%29'
            ),
            slats: extLink('https://en.wikipedia.org/wiki/Leading-edge_slat'),
          })}
        </p>

        <Image
          src={assetUrl('kurdistan-fig-5.jpg')}
          alt={t('imageAlt5')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>
          {t.rich('pSplatsHow', {
            above: (chunks) => <em>{chunks}</em>,
            below: (chunks) => <em>{chunks}</em>,
            chord: extLink(
              'https://en.wikipedia.org/wiki/Chord_%28aeronautics%29'
            ),
            do: (chunks) => <em>{chunks}</em>,
          })}
        </p>

        <Image
          src={assetUrl('kurdistan-fig-6.jpg')}
          alt={t('imageAlt6')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pGimbal')}</p>

        <Image
          src={assetUrl('kurdistan-fig-7.jpg')}
          alt={t('imageAlt7')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pAvionics')}</p>

        <Image
          src={assetUrl('kurdistan-fig-8.jpg')}
          alt={t('imageAlt8')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <Image
          src={assetUrl('kurdistan-fig-9.jpg')}
          alt={t('imageAlt9')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pLaunch')}</p>

        <Image
          src={assetUrl('kurdistan-fig-10.jpg')}
          alt={t('imageAlt10')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pScout')}</p>

        <Image
          src={assetUrl('kurdistan-fig-11.jpg')}
          alt={t('imageAlt11')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pBerm')}</p>

        <Image
          src={assetUrl('kurdistan-fig-12.jpg')}
          alt={t('imageAlt12')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pMortar')}</p>

        <Image
          src={assetUrl('kurdistan-fig-13.jpg')}
          alt={t('imageAlt13')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <h2
          className={`${headingClass} mt-8 mb-4 text-xl text-zinc-700 min-[800px]:text-2xl dark:text-zinc-50`}
        >
          {t('firstAidHeading')}
        </h2>

        <p>{t('pFirstAid')}</p>

        <Image
          src={assetUrl('kurdistan-fig-14.jpg')}
          alt={t('imageAlt14')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pGraduation')}</p>

        <Image
          src={assetUrl('kurdistan-fig-15.jpg')}
          alt={t('imageAlt15')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pK24')}</p>

        <Image
          src={assetUrl('kurdistan-fig-16.jpg')}
          alt={t('imageAlt16')}
          width={1200}
          height={800}
          className="my-6 h-auto w-full"
        />

        <p>{t('pHiMom')}</p>
      </article>
    </div>
  )
}
