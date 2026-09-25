'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { IoLanguageSharp } from 'react-icons/io5'

import {
  NAVBAR_ICON_GLYPH_PX,
  navbarIconButtonClassName,
  slideTileTowardCenter,
} from '@/components/navbarIconButton'
import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

/** Long enough for the press color to finish fading in before the menu closes. */
const PRESS_VISIBLE_MS = 280

// Survives the locale-layout remount (html/body are in `[locale]/layout`).
// Assignments stay in module functions so the component does not write this during render.
let pendingScrollY: number | null = null

function capturePendingScroll() {
  pendingScrollY = window.scrollY
}

function clearPendingScroll() {
  pendingScrollY = null
}

function fontForLocale(code: string) {
  if (code === 'ar') return 'var(--font-arabic)'
  if (code === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

const menuTransition = {
  duration: 0.18,
  ease: 'easeOut',
} as const

export default function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [pressedLocale, setPressedLocale] = useState<Locale | null>(null)
  const reduceMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const listId = useId()

  useLayoutEffect(() => {
    if (pendingScrollY == null) return

    const y = pendingScrollY
    window.scrollTo({ top: y, left: 0, behavior: 'instant' })

    const frame = requestAnimationFrame(clearPendingScroll)
    return () => cancelAnimationFrame(frame)
  }, [locale])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPressedLocale(null)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPressedLocale(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  function selectLocale(nextLocale: Locale) {
    setPressedLocale(nextLocale)
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
      setPressedLocale(null)
      if (nextLocale === locale) return

      capturePendingScroll()
      startTransition(() => {
        router.replace(pathname, { locale: nextLocale, scroll: false })
      })
    }, reduceMotion ? 0 : PRESS_VISIBLE_MS)
  }

  return (
    <div ref={rootRef} className="relative inline-flex text-sm">
      <button
        ref={tileRef}
        type="button"
        disabled={isPending}
        aria-label={t('label')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          slideTileTowardCenter(tileRef.current, reduceMotion)
          setPressedLocale(null)
          setOpen((value) => !value)
        }}
        className={navbarIconButtonClassName}
      >
        <IoLanguageSharp aria-hidden size={NAVBAR_ICON_GLYPH_PX} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={t('label')}
            className="absolute top-full inset-e-0 z-50 mt-1 min-w-36 overflow-hidden rounded border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
            }
            transition={reduceMotion ? { duration: 0 } : menuTransition}
          >
            {routing.locales.map((code, index) => {
              const selected = code === locale
              const pressed = pressedLocale === code
              return (
                <motion.li
                  key={code}
                  role="presentation"
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { ...menuTransition, delay: 0.04 + index * 0.045 }
                  }
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onPointerDown={() => setPressedLocale(code)}
                    onPointerLeave={() => {
                      if (closeTimerRef.current == null) setPressedLocale(null)
                    }}
                    onClick={() => selectLocale(code)}
                    style={{ fontFamily: fontForLocale(code) }}
                    className={`block w-full cursor-pointer px-3 py-1.5 text-start text-sm whitespace-nowrap outline-none transition-colors duration-150 ${
                      pressed
                        ? 'bg-[#f4ecd4] text-[#8a6914] dark:bg-[#3f3620] dark:text-[#e4c56a]'
                        : `text-black dark:text-zinc-50 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#c5d0e2] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#4a5670] ${
                            selected ? 'font-semibold' : ''
                          }`
                    }`}
                  >
                    {t(code)}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
