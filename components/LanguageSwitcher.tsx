'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition, type ChangeEvent } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">{t('label')}</span>
      <select
        name="locale"
        value={locale}
        onChange={onChange}
        disabled={isPending}
        aria-label={t('label')}
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  )
}
