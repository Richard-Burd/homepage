'use client'

import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState, type CSSProperties } from 'react'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import NavMenu from '@/components/NavMenu'
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

export default function Navbar() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0

    if (current > previous && current > 24) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-(--navbar-border) bg-(--navbar-bg) dark:border-(--navbar-border-dark) dark:bg-(--navbar-bg-dark)"
      style={navbarColorVars}
      initial={false}
      animate={{ y: hidden ? '-100%' : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
