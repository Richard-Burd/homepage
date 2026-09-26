'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { GiHamburgerMenu } from 'react-icons/gi'

import {
  NAVBAR_ICON_GLYPH_PX,
  navbarIconButtonClassName,
  slideTileTowardCenter,
} from '@/components/navbarIconButton'
import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { Link, usePathname } from '@/i18n/navigation'

function fontForLocale(code: string) {
  if (code === 'ar') return 'var(--font-arabic)'
  if (code === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

const LINKEDIN_HREF = 'https://www.linkedin.com/in/richardburd/'

/** Long enough for the press color to finish fading in before the menu closes. */
const PRESS_VISIBLE_MS = 280

const menuTransition = {
  duration: 0.18,
  ease: 'easeOut',
} as const

type MenuItemId =
  | 'home'
  | 'knowledge-domains'
  | 'core-capabilities'
  | 'technology-stack'
  | 'linkedin'

function itemClassName(pressed: boolean) {
  return `block w-full cursor-pointer px-3 py-1.5 text-start text-sm whitespace-nowrap outline-none transition-colors duration-150 ${
    pressed
      ? 'bg-[#f4ecd4] text-[#8a6914] dark:bg-[#3f3620] dark:text-[#e4c56a]'
      : 'text-black dark:text-zinc-50 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#c5d0e2] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#4a5670]'
  }`
}

export default function NavMenu() {
  const t = useTranslations('NavMenu')
  const tDomains = useTranslations('DomainsPie')
  const tCapabilities = useTranslations('CapabilitiesPie')
  const tTechStacks = useTranslations('TechStacks')
  const tHome = useTranslations('HomePage')
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [pressedItem, setPressedItem] = useState<MenuItemId | null>(null)
  const reduceMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const listId = useId()
  const itemFont = { fontFamily: fontForLocale(locale) }

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPressedItem(null)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPressedItem(null)
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

  function runAfterPress(id: MenuItemId, action: () => void) {
    setPressedItem(id)
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
      setPressedItem(null)
      action()
    }, reduceMotion ? 0 : PRESS_VISIBLE_MS)
  }

  function goToHomeHash(
    event: MouseEvent<HTMLAnchorElement>,
    hash: Exclude<MenuItemId, 'linkedin'>
  ) {
    if (pathname !== '/') {
      runAfterPress(hash, () => {})
      return
    }

    event.preventDefault()
    runAfterPress(hash, () => {
      const behavior = reduceMotion ? 'auto' : 'smooth'

      if (hash === 'home') {
        window.scrollTo({ top: 0, behavior })
      } else {
        document.getElementById(hash)?.scrollIntoView({ behavior, block: 'start' })
      }

      history.pushState(null, '', `#${hash}`)
    })
  }

  const items: Array<{
    id: Exclude<MenuItemId, 'linkedin'>
    label: string
  }> = [
    { id: 'home', label: t('home') },
    { id: 'knowledge-domains', label: tDomains('title') },
    { id: 'core-capabilities', label: tCapabilities('title') },
    { id: 'technology-stack', label: tTechStacks('sectionTitle') },
  ]

  return (
    <div ref={rootRef} className="relative inline-flex text-sm">
      <button
        ref={tileRef}
        type="button"
        aria-label={t('label')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          slideTileTowardCenter(tileRef.current, reduceMotion)
          setPressedItem(null)
          setOpen((value) => !value)
        }}
        className={navbarIconButtonClassName}
      >
        <GiHamburgerMenu aria-hidden size={NAVBAR_ICON_GLYPH_PX} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="menu"
            aria-label={t('label')}
            className="absolute top-full inset-s-0 z-50 mt-1 min-w-full overflow-hidden rounded border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0 } : menuTransition}
          >
            {items.map((item, index) => (
              <motion.li
                key={item.id}
                role="none"
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { ...menuTransition, delay: 0.04 + index * 0.045 }
                }
              >
                <Link
                  role="menuitem"
                  href={{ pathname: '/', hash: item.id }}
                  style={itemFont}
                  className={itemClassName(pressedItem === item.id)}
                  onPointerDown={() => setPressedItem(item.id)}
                  onPointerLeave={() => {
                    if (closeTimerRef.current == null) setPressedItem(null)
                  }}
                  onClick={(event) => goToHomeHash(event, item.id)}
                >
                  {item.label}
                </Link>
              </motion.li>
            ))}
            <motion.li
              role="none"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { ...menuTransition, delay: 0.04 + items.length * 0.045 }
              }
            >
              <a
                role="menuitem"
                href={LINKEDIN_HREF}
                target="_blank"
                rel="noopener noreferrer"
                style={itemFont}
                className={itemClassName(pressedItem === 'linkedin')}
                onPointerDown={() => setPressedItem('linkedin')}
                onPointerLeave={() => {
                  if (closeTimerRef.current == null) setPressedItem(null)
                }}
                onClick={() => runAfterPress('linkedin', () => {})}
              >
                {tHome('linkedin')}
              </a>
            </motion.li>
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
