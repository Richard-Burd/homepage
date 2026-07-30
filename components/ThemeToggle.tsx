'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type ChangeEvent } from 'react'

import {
  applyTheme,
  getResolvedTheme,
  getStoredTheme,
  getSystemTheme,
  setTheme,
  type Theme,
} from '@/lib/theme'

export default function ThemeToggle() {
  const t = useTranslations('ThemeSwitcher')
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const resolved = getResolvedTheme()
    applyTheme(resolved)
    setThemeState(resolved)
    setMounted(true)

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function onSystemChange() {
      if (getStoredTheme() !== null) {
        return
      }
      const next = getSystemTheme()
      applyTheme(next)
      setThemeState(next)
    }

    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Theme
    setTheme(next)
    setThemeState(next)
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">{t('label')}</span>
      <select
        name="theme"
        value={theme}
        onChange={onChange}
        disabled={!mounted}
        aria-label={t('label')}
        suppressHydrationWarning
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
      >
        <option value="light">{t('light')}</option>
        <option value="dark">{t('dark')}</option>
      </select>
    </label>
  )
}
