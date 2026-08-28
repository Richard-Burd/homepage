import { setRequestLocale } from 'next-intl/server'

import TestAnimation from '@/components/animations/TestAnimation'

type Props = {
  params: Promise<{ locale: string }>
}

export const metadata = {
  title: 'Test Animations',
}

export default async function AnimationsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-200 dark:bg-zinc-800">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center bg-white px-4 py-16 dark:bg-black">
        <h1 className="mb-12 text-center text-3xl font-bold tracking-wide text-zinc-700 min-[800px]:text-[2.625rem] min-[800px]:leading-tight dark:text-zinc-50">
          Test Animations
        </h1>
        <TestAnimation />
      </main>
    </div>
  )
}
