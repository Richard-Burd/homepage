'use client'

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from 'motion/react'
import { useLayoutEffect, useRef, type CSSProperties } from 'react'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import NavMenu from '@/components/NavMenu'
import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
// import ThemeToggle from '@/components/ThemeToggle'
import ThemeToggleAnimation from '@/components/ThemeToggleAnimation'

const NAVBAR_LIGHT_MODE_BACKGROUND_COLOR = '#b4b6c3'
const NAVBAR_DARK_MODE_BACKGROUND_COLOR = '#4b4c52'

const NAVBAR_LIGHT_MODE_BORDER_COLOR = '#697ca0'
const NAVBAR_DARK_MODE_BORDER_COLOR = '#292a2e'

const LIGHT_MODE_BUTTON_BORDER_COLOR = '#f0ece1'
const DARK_MODE_BUTTON_BORDER_COLOR = '#ab8922'

const navbarColorVars = {
  '--navbar-bg': NAVBAR_LIGHT_MODE_BACKGROUND_COLOR,
  '--navbar-bg-dark': NAVBAR_DARK_MODE_BACKGROUND_COLOR,
  '--navbar-border': NAVBAR_LIGHT_MODE_BORDER_COLOR,
  '--navbar-border-dark': NAVBAR_DARK_MODE_BORDER_COLOR,
} as CSSProperties

/**
 * Scroll-linked (scroll-coupled) hide-on-scroll — the same idea as Chrome’s
 * mobile Omnibox / “dynamic toolbar”: the bar translates with scroll delta
 * instead of animating show/hide on its own timeline.
 */
export default function Navbar() {
  const { scrollY } = useScroll()
  const y = useMotionValue(0)
  const headerRef = useRef<HTMLElement>(null)
  const heightRef = useRef(0)
  const reduceMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    const updateHeight = () => {
      const height = el.getBoundingClientRect().height
      heightRef.current = height
      // Keep a partial hide valid if the bar resizes (font/zoom/menu).
      y.set(Math.min(0, Math.max(-height, y.get())))
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [y])

  useMotionValueEvent(scrollY, 'change', (current) => {
    if (reduceMotion) {
      y.set(0)
      return
    }

    // Page top: always fully visible.
    if (current <= 0) {
      y.set(0)
      return
    }

    const previous = scrollY.getPrevious() ?? 0
    const delta = current - previous
    const height = heightRef.current
    if (height <= 0) return

    // 1px scroll → 1px navbar movement; clamp between shown (0) and hidden.
    y.set(Math.min(0, Math.max(-height, y.get() - delta)))
  })

  return (
    <motion.header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-(--navbar-border) bg-(--navbar-bg) dark:border-(--navbar-border-dark) dark:bg-(--navbar-bg-dark)"
      style={{ ...navbarColorVars, y }}
    >
      <nav
        aria-label="Site"
        className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3"
      >
        <NavMenu />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {/* <ThemeToggle /> */}
          <ThemeToggleAnimation
            lightBorderColor={LIGHT_MODE_BUTTON_BORDER_COLOR}
            darkBorderColor={DARK_MODE_BUTTON_BORDER_COLOR}
          />
        </div>
      </nav>
    </motion.header>
  )
}
