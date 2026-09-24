import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { assetUrl } from '@/lib/assets'

type Props = {
  params: Promise<{ locale: string }>
}

const linkClassName = 'text-blue-600 underline dark:text-blue-400'
const figureClassName = 'my-6 h-auto w-full'

type ThemedSrc = {
  src: string
  width: number
  height: number
}

function figureImage(src: ThemedSrc, alt: string, className: string) {
  return (
    <Image
      src={assetUrl(src.src)}
      alt={alt}
      width={src.width}
      height={src.height}
      className={className}
    />
  )
}

function ThemedImage({
  alt,
  light,
  dark,
}: {
  alt: string
  light: ThemedSrc
  dark: ThemedSrc
}) {
  return (
    <>
      {figureImage(light, alt, `${figureClassName} dark:hidden`)}
      {figureImage(dark, alt, `${figureClassName} hidden dark:block`)}
    </>
  )
}

function ThemedArtDirectedImage({
  alt,
  lightDesktop,
  lightMobile,
  darkDesktop,
  darkMobile,
}: {
  alt: string
  lightDesktop: ThemedSrc
  lightMobile: ThemedSrc
  darkDesktop: ThemedSrc
  darkMobile: ThemedSrc
}) {
  return (
    <>
      <div className="dark:hidden">
        {figureImage(lightMobile, alt, `${figureClassName} min-[800px]:hidden`)}
        {figureImage(
          lightDesktop,
          alt,
          `${figureClassName} hidden min-[800px]:block`
        )}
      </div>
      <div className="hidden dark:block">
        {figureImage(darkMobile, alt, `${figureClassName} min-[800px]:hidden`)}
        {figureImage(
          darkDesktop,
          alt,
          `${figureClassName} hidden min-[800px]:block`
        )}
      </div>
    </>
  )
}

function extLink(href: string, dir?: 'ltr' | 'rtl') {
  function RichLink(chunks: ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        dir={dir}
      >
        {chunks}
      </a>
    )
  }

  return RichLink
}

type ArtDirectedSet = {
  lightDesktop: ThemedSrc
  lightMobile: ThemedSrc
  darkDesktop: ThemedSrc
  darkMobile: ThemedSrc
}

type PageLocale = 'en' | 'ar' | 'he'

function pageLocale(locale: string): PageLocale {
  if (locale === 'ar' || locale === 'he') return locale
  return 'en'
}

const fig1ByLocale = {
  en: {
    lightDesktop: {
      src: 'kurdistan-fig-1-light-desktop-english-arabic.3.png',
      width: 1000,
      height: 2156,
    },
    lightMobile: {
      src: 'kurdistan-fig-1-light-mobile-english.3.png',
      width: 800,
      height: 2990,
    },
    darkDesktop: {
      src: 'kurdistan-fig-1-dark-desktop-english-arabic.3.png',
      width: 1001,
      height: 2138,
    },
    darkMobile: {
      src: 'kurdistan-fig-1-dark-mobile-english.3.png',
      width: 800,
      height: 2990,
    },
  },
  ar: {
    lightDesktop: {
      src: 'kurdistan-fig-1-light-desktop-english-arabic.3.png',
      width: 1000,
      height: 2156,
    },
    lightMobile: {
      src: 'kurdistan-fig-1-light-mobile-arabic.3.png',
      width: 800,
      height: 2990,
    },
    darkDesktop: {
      src: 'kurdistan-fig-1-dark-desktop-english-arabic.3.png',
      width: 1001,
      height: 2138,
    },
    darkMobile: {
      src: 'kurdistan-fig-1-dark-mobile-arabic.3.png',
      width: 800,
      height: 2990,
    },
  },
  he: {
    lightDesktop: {
      src: 'kurdistan-fig-1-light-desktop-english-hebrew.4.png',
      width: 1000,
      height: 2149,
    },
    lightMobile: {
      src: 'kurdistan-fig-1-light-mobile-hebrew.4.png',
      width: 800,
      height: 2990,
    },
    darkDesktop: {
      src: 'kurdistan-fig-1-dark-desktop-english-hebrew.4.png',
      width: 1000,
      height: 2130,
    },
    darkMobile: {
      src: 'kurdistan-fig-1-dark-mobile-hebrew.4.png',
      width: 800,
      height: 2990,
    },
  },
} as const satisfies Record<PageLocale, ArtDirectedSet>

const fig4ByLocale = {
  en: {
    lightDesktop: {
      src: 'kurdistan-fig-4-light-desktop-english.3.png',
      width: 1000,
      height: 813,
    },
    lightMobile: {
      src: 'kurdistan-fig-4-light-mobile-english.3.png',
      width: 800,
      height: 661,
    },
    darkDesktop: {
      src: 'kurdistan-fig-4-dark-desktop-english.3.png',
      width: 1000,
      height: 812,
    },
    darkMobile: {
      src: 'kurdistan-fig-4-dark-mobile-english.3.png',
      width: 800,
      height: 658,
    },
  },
  ar: {
    lightDesktop: {
      src: 'kurdistan-fig-4-light-desktop-arabic.3.png',
      width: 1000,
      height: 812,
    },
    lightMobile: {
      src: 'kurdistan-fig-4-light-mobile-arabic.3.png',
      width: 800,
      height: 662,
    },
    darkDesktop: {
      src: 'kurdistan-fig-4-dark-desktop-arabic.3.png',
      width: 1000,
      height: 811,
    },
    darkMobile: {
      src: 'kurdistan-fig-4-dark-mobile-arabic.3.png',
      width: 800,
      height: 659,
    },
  },
  he: {
    lightDesktop: {
      src: 'kurdistan-fig-4-light-desktop-hebrew.3.png',
      width: 1000,
      height: 810,
    },
    lightMobile: {
      src: 'kurdistan-fig-4-light-mobile-hebrew.3.png',
      width: 800,
      height: 657,
    },
    darkDesktop: {
      src: 'kurdistan-fig-4-dark-desktop-hebrew.3.png',
      width: 1000,
      height: 808,
    },
    darkMobile: {
      src: 'kurdistan-fig-4-dark-mobile-hebrew.3.png',
      width: 800,
      height: 655,
    },
  },
} as const satisfies Record<PageLocale, ArtDirectedSet>

const fig5ByLocale = {
  en: {
    lightDesktop: {
      src: 'kurdistan-fig-5-light-desktop-english.3.png',
      width: 1000,
      height: 679,
    },
    lightMobile: {
      src: 'kurdistan-fig-5-light-mobile-english.3.png',
      width: 800,
      height: 579,
    },
    darkDesktop: {
      src: 'kurdistan-fig-5-dark-desktop-english.3.png',
      width: 1000,
      height: 679,
    },
    darkMobile: {
      src: 'kurdistan-fig-5-dark-mobile-english.3.png',
      width: 800,
      height: 579,
    },
  },
  ar: {
    lightDesktop: {
      src: 'kurdistan-fig-5-light-desktop-arabic.3.png',
      width: 1000,
      height: 679,
    },
    lightMobile: {
      src: 'kurdistan-fig-5-light-mobile-arabic.3.png',
      width: 800,
      height: 595,
    },
    darkDesktop: {
      src: 'kurdistan-fig-5-dark-desktop-arabic.3.png',
      width: 1000,
      height: 679,
    },
    darkMobile: {
      src: 'kurdistan-fig-5-dark-mobile-arabic.3.png',
      width: 800,
      height: 595,
    },
  },
  he: {
    lightDesktop: {
      src: 'kurdistan-fig-5-light-desktop-hebrew.3.png',
      width: 1000,
      height: 679,
    },
    lightMobile: {
      src: 'kurdistan-fig-5-light-mobile-hebrew.3.png',
      width: 800,
      height: 566,
    },
    darkDesktop: {
      src: 'kurdistan-fig-5-dark-desktop-hebrew.3.png',
      width: 1000,
      height: 679,
    },
    darkMobile: {
      src: 'kurdistan-fig-5-dark-mobile-hebrew.3.png',
      width: 800,
      height: 566,
    },
  },
} as const satisfies Record<PageLocale, ArtDirectedSet>

const fig6ByLocale = {
  en: {
    lightDesktop: {
      src: 'kurdistan-fig-6-light-desktop-english.3.png',
      width: 1000,
      height: 394,
    },
    lightMobile: {
      src: 'kurdistan-fig-6-light-mobile-english.3.png',
      width: 800,
      height: 316,
    },
    darkDesktop: {
      src: 'kurdistan-fig-6-dark-desktop-english.3.png',
      width: 1000,
      height: 394,
    },
    darkMobile: {
      src: 'kurdistan-fig-6-dark-mobile-english.3.png',
      width: 800,
      height: 316,
    },
  },
  ar: {
    lightDesktop: {
      src: 'kurdistan-fig-6-light-desktop-arabic.3.png',
      width: 1000,
      height: 394,
    },
    lightMobile: {
      src: 'kurdistan-fig-6-light-mobile-arabic.3.png',
      width: 800,
      height: 316,
    },
    darkDesktop: {
      src: 'kurdistan-fig-6-dark-desktop-arabic.3.png',
      width: 1000,
      height: 394,
    },
    darkMobile: {
      src: 'kurdistan-fig-6-dark-mobile-arabic.3.png',
      width: 800,
      height: 316,
    },
  },
  he: {
    lightDesktop: {
      src: 'kurdistan-fig-6-light-desktop-hebrew.3.png',
      width: 1000,
      height: 394,
    },
    lightMobile: {
      src: 'kurdistan-fig-6-light-mobile-hebrew.3.png',
      width: 800,
      height: 316,
    },
    darkDesktop: {
      src: 'kurdistan-fig-6-dark-desktop-hebrew.3.png',
      width: 1000,
      height: 394,
    },
    darkMobile: {
      src: 'kurdistan-fig-6-dark-mobile-hebrew.3.png',
      width: 800,
      height: 316,
    },
  },
} as const satisfies Record<PageLocale, ArtDirectedSet>

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
  const imgLocale = pageLocale(locale)
  const fig1 = fig1ByLocale[imgLocale]
  const fig4 = fig4ByLocale[imgLocale]
  const fig5 = fig5ByLocale[imgLocale]
  const fig6 = fig6ByLocale[imgLocale]

  const headingClass =
    locale === 'ar'
      ? 'font-(family-name:--font-arabic) font-bold tracking-wider'
      : locale === 'he'
        ? 'font-(family-name:--font-hebrew) font-bold'
        : 'font-(family-name:--font-roboto) font-bold tracking-wide'

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-800">
      <article className="flex w-full max-w-3xl flex-1 flex-col bg-white pt-(--navbar-height,4.15rem) pb-32 text-[1.0rem] leading-relaxed md:text-[1.125rem] dark:bg-black">
        <header className="relative mb-8 w-full overflow-hidden min-[800px]:aspect-[1298/356.8]">
          <Image
            src={assetUrl('kurdistan-banner.1.png')}
            alt={t('bannerAlt')}
            width={1298}
            height={446}
            className="h-auto w-full min-[800px]:absolute min-[800px]:inset-0 min-[800px]:h-full min-[800px]:object-cover min-[800px]:object-center"
            priority
          />
          <h1
            className={`${headingClass} absolute inset-0 flex items-center justify-center px-4 text-center text-3xl text-zinc-50 min-[800px]:text-[2.625rem] min-[800px]:leading-tight`}
          >
            {t('title')}
          </h1>
        </header>

        <div className="px-4">
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

          <p className="my-6 flex justify-center">
            <a
              href="https://youtu.be/Dy6FYWNopsE"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('youtubeAria')}
              className="inline-flex items-center transition-opacity hover:opacity-70"
            >
              <Image
                src={assetUrl('you-tube-icon.svg')}
                alt=""
                width={50}
                height={50}
                unoptimized
                aria-hidden
              />
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

          <ThemedArtDirectedImage
            alt={t('imageAlt1')}
            lightDesktop={fig1.lightDesktop}
            lightMobile={fig1.lightMobile}
            darkDesktop={fig1.darkDesktop}
            darkMobile={fig1.darkMobile}
          />

          <p>{t('pExpendable')}</p>

          <ThemedImage
            alt={t('imageAlt2')}
            light={{
              src: 'kurdistan-fig-2-light.png',
              width: 2604,
              height: 1315,
            }}
            dark={{
              src: 'kurdistan-fig-2-dark.png',
              width: 1000,
              height: 505,
            }}
          />

          <p>{t('pRange')}</p>

          <Image
            src={assetUrl('kurdistan-fig-3.jpg')}
            alt={t('imageAlt3')}
            width={1200}
            height={800}
            className="my-6 h-auto w-full"
          />

          <p>
            {t.rich('pSplatsName', {
              splats: (chunks) => (
                <strong>
                  <em>{chunks}</em>
                </strong>
              ),
            })}
          </p>

          <ThemedArtDirectedImage
            alt={t('imageAlt4')}
            lightDesktop={fig4.lightDesktop}
            lightMobile={fig4.lightMobile}
            darkDesktop={fig4.darkDesktop}
            darkMobile={fig4.darkMobile}
          />

          <p>
            {t.rich('pSplatsDef', {
              spoilers: extLink(
                locale === 'ar'
                  ? 'https://ar.wikipedia.org/wiki/%D9%85%D8%AB%D8%A8%D8%B7_%D8%A7%D9%84%D8%B1%D9%81%D8%B9_(%D8%B7%D9%8A%D8%B1%D8%A7%D9%86)'
                  : locale === 'he'
                    ? 'https://he.wikipedia.org/wiki/%D7%A1%D7%A4%D7%95%D7%99%D7%9C%D7%A8_(%D7%AA%D7%A2%D7%95%D7%A4%D7%94)'
                    : 'https://en.wikipedia.org/wiki/Spoiler_%28aeronautics%29',
                locale === 'ar' ? 'ltr' : undefined
              ),
              slats: extLink(
                locale === 'ar'
                  ? 'https://ar.wikipedia.org/wiki/%D8%B3%D8%AF%D9%81%D8%A9'
                  : locale === 'he'
                    ? 'https://he.wikipedia.org/wiki/%D7%9E%D7%93%D7%A3_(%D7%AA%D7%A2%D7%95%D7%A4%D7%94)'
                    : 'https://en.wikipedia.org/wiki/Leading-edge_slat',
                locale === 'he' || locale === 'ar' ? 'ltr' : undefined
              ),
            })}
          </p>

          <ThemedArtDirectedImage
            alt={t('imageAlt5')}
            lightDesktop={fig5.lightDesktop}
            lightMobile={fig5.lightMobile}
            darkDesktop={fig5.darkDesktop}
            darkMobile={fig5.darkMobile}
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

          <ThemedArtDirectedImage
            alt={t('imageAlt6')}
            lightDesktop={fig6.lightDesktop}
            lightMobile={fig6.lightMobile}
            darkDesktop={fig6.darkDesktop}
            darkMobile={fig6.darkMobile}
          />

          <p>{t('pGimbal')}</p>

          <ThemedArtDirectedImage
            alt={t('imageAlt7')}
            lightDesktop={{
              src: 'kurdistan-fig-7-light-desktop.2.png',
              width: 1000,
              height: 1422,
            }}
            lightMobile={{
              src: 'kurdistan-fig-7-light-mobile.png',
              width: 600,
              height: 2656,
            }}
            darkDesktop={{
              src: 'kurdistan-fig-7-dark-desktop.2.png',
              width: 1000,
              height: 1422,
            }}
            darkMobile={{
              src: 'kurdistan-fig-7-dark-mobile.png',
              width: 600,
              height: 2656,
            }}
          />

          <p>{t('pAvionics')}</p>

          <ThemedImage
            alt={t('imageAlt8')}
            light={{
              src: 'kurdistan-fig-8-light.png',
              width: 1000,
              height: 2350,
            }}
            dark={{
              src: 'kurdistan-fig-8-dark.png',
              width: 1000,
              height: 2350,
            }}
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
        </div>
      </article>
    </div>
  )
}
