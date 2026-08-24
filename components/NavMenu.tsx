'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { GiHamburgerMenu } from 'react-icons/gi'

function fontForLocale(code: string) {
  if (code === 'ar') return 'var(--font-arabic)'
  if (code === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

const LINKEDIN_HREF = 'https://www.linkedin.com/in/richardburd/'

export default function NavMenu() {
  const t = useTranslations('NavMenu')
  const tDomains = useTranslations('DomainsPie')
  const tCapabilities = useTranslations('CapabilitiesPie')
  const tTechStacks = useTranslations('TechStacks')
  const tHome = useTranslations('HomePage')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const itemFont = { fontFamily: fontForLocale(locale) }

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

  const itemClassName =
    'block w-full px-3 py-1.5 text-start text-sm whitespace-nowrap text-black outline-none hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800'

  return (
    <div ref={rootRef} className="relative inline-flex text-sm">
      <button
        type="button"
        aria-label={t('label')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
      >
        <GiHamburgerMenu aria-hidden size={18} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="menu"
          aria-label={t('label')}
          className="absolute top-full inset-s-0 z-50 mt-1 min-w-full overflow-hidden rounded border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <li role="none">
            <a
              role="menuitem"
              href="#knowledge-domains"
              style={itemFont}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              {tDomains('title')}
            </a>
          </li>
          <li role="none">
            <a
              role="menuitem"
              href="#core-capabilities"
              style={itemFont}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              {tCapabilities('title')}
            </a>
          </li>
          <li role="none">
            <a
              role="menuitem"
              href="#technology-stack"
              style={itemFont}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              {tTechStacks('sectionTitle')}
            </a>
          </li>
          <li role="none">
            <a
              role="menuitem"
              href={LINKEDIN_HREF}
              target="_blank"
              rel="noopener noreferrer"
              style={itemFont}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              {tHome('linkedin')}
            </a>
          </li>
        </ul>
      ) : null}
    </div>
  )
}
