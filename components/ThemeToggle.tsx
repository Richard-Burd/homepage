'use client'

import { useTranslations } from 'next-intl'
import { useSyncExternalStore, type ChangeEvent } from 'react'

import {
  getResolvedTheme,
  getServerThemeSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme'

export default function ThemeToggle() {
  const t = useTranslations('ThemeSwitcher')
  const theme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerThemeSnapshot,
  )

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    setTheme(event.target.value as Theme)
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">{t('label')}</span>
      <select
        name="theme"
        value={theme}
        onChange={onChange}
        aria-label={t('label')}
        suppressHydrationWarning
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
      >
        <option value="light">{t('light')}</option>
        <option value="dark">{t('dark')}</option>
      </select>
    </label>
  )
}
