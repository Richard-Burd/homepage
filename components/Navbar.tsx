'use client'

import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import NavMenu from '@/components/NavMenu'
import ThemeToggle from '@/components/ThemeToggle'

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
      className="fixed inset-x-0 top-0 z-50 border-b border-[#131a26] bg-[#c8d1e3] dark:border-[#dde1eb] dark:bg-[#434e63]"
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
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  )
}
