'use client'

import { useEffect } from 'react'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'

    if (hash === '#home') {
      window.scrollTo({ top: 0, behavior })
      return
    }

    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView({ behavior, block: 'start' })
  }, [])

  return null
}
