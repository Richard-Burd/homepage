'use client'

import type { ReactNode } from 'react'

import { usePathname } from '@/i18n/navigation'

type Props = {
  children: ReactNode
}

/** Full-bleed social strip on wide layouts (e.g. schematic visualization). */
function isFullWidthSocialPath(pathname: string) {
  return (
    pathname === '/schematic-visualization' ||
    pathname.endsWith('/schematic-visualization')
  )
}

export default function FooterSocialBand({ children }: Props) {
  const pathname = usePathname()
  const fullWidth = isFullWidthSocialPath(pathname)

  return (
    <div
      className={`bg-[#ffffff] dark:bg-[#000000] ${
        fullWidth ? 'w-full' : 'mx-auto w-full max-w-3xl'
      }`}
    >
      {children}
    </div>
  )
}
