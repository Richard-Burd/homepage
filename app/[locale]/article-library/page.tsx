import { getTranslations, setRequestLocale } from 'next-intl/server'

import ArticleLibraryList from '@/components/ArticleLibraryList'
import { pageMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'ArticleLibraryPage',
  })

  return pageMetadata({
    locale,
    pathname: '/article-library',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function ArticleLibraryPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ArticleLibraryPage')

  const headingClass =
    locale === 'ar'
      ? 'font-(family-name:--font-arabic) font-bold tracking-wider'
      : locale === 'he'
        ? 'font-(family-name:--font-hebrew) font-bold'
        : 'font-(family-name:--font-roboto) font-bold tracking-wide'

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-200 dark:bg-zinc-800">
      <main className="flex w-full max-w-4xl flex-1 flex-col items-center bg-white px-4 py-32 sm:px-8 dark:bg-black">
        <h1
          className={`${headingClass} mb-12 text-center text-3xl text-zinc-700 min-[800px]:text-[2.625rem] min-[800px]:leading-tight dark:text-zinc-50`}
        >
          {t('title')}
        </h1>
        <ArticleLibraryList />
      </main>
    </div>
  )
}
