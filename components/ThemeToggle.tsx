'use client'

import { useTranslations } from 'next-intl'
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import {
  getResolvedTheme,
  getServerThemeSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme'

const THEMES: Theme[] = ['light', 'dark']

export default function ThemeToggle() {
  const t = useTranslations('ThemeSwitcher')
  const theme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerThemeSnapshot
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectTheme(nextTheme: Theme) {
    setOpen(false)
    setTheme(nextTheme)
  }

  return (
    <div ref={rootRef} className="relative inline-flex text-sm">
      <button
        type="button"
        aria-label={t('label')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        suppressHydrationWarning
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
      >
        {t(theme)}
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('label')}
          className="absolute top-full inset-e-0 z-50 mt-1 min-w-full overflow-hidden rounded border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          {THEMES.map((value) => {
            const selected = value === theme
            return (
              <li key={value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectTheme(value)}
                  className={`block w-full px-3 py-1.5 text-start text-sm whitespace-nowrap text-black outline-none hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800 ${
                    selected ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                >
                  {t(value)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
