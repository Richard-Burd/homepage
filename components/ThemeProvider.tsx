'use client'

import { useLocale } from 'next-intl'
import { useLayoutEffect, type ReactNode } from 'react'

import { applyTheme, getResolvedTheme } from '@/lib/theme'

/**
 * Re-applies the resolved theme after React commits.
 *
 * Theme is set on <html> outside React (blocking script + classList) for FOUC
 * prevention. Soft navigations (e.g. locale switches) re-render the locale
 * layout and can overwrite documentElement.className — this restores `dark`
 * before paint. See Next.js "Preventing flash before hydration" (client nav).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const locale = useLocale()

  useLayoutEffect(() => {
    applyTheme(getResolvedTheme())
  }, [locale])

  return children
}
