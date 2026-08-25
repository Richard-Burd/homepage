'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { GiHamburgerMenu } from 'react-icons/gi'

import { Link, usePathname } from '@/i18n/navigation'

function fontForLocale(code: string) {
  if (code === 'ar') return 'var(--font-arabic)'
  if (code === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

const LINKEDIN_HREF = 'https://www.linkedin.com/in/richardburd/'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

  function goToHomeHash(event: MouseEvent<HTMLAnchorElement>, hash: string) {
    setOpen(false)

    if (pathname !== '/') {
      return
    }

    event.preventDefault()

    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'

    if (hash === 'home') {
      window.scrollTo({ top: 0, behavior })
    } else {
      document.getElementById(hash)?.scrollIntoView({ behavior, block: 'start' })
    }

    history.pushState(null, '', `#${hash}`)
  }

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
            <Link
              role="menuitem"
              href={{ pathname: '/', hash: 'home' }}
              style={itemFont}
              className={itemClassName}
              onClick={(event) => goToHomeHash(event, 'home')}
            >
              {t('home')}
            </Link>
          </li>
          <li role="none">
            <Link
              role="menuitem"
              href={{ pathname: '/', hash: 'knowledge-domains' }}
              style={itemFont}
              className={itemClassName}
              onClick={(event) => goToHomeHash(event, 'knowledge-domains')}
            >
              {tDomains('title')}
            </Link>
          </li>
          <li role="none">
            <Link
              role="menuitem"
              href={{ pathname: '/', hash: 'core-capabilities' }}
              style={itemFont}
              className={itemClassName}
              onClick={(event) => goToHomeHash(event, 'core-capabilities')}
            >
              {tCapabilities('title')}
            </Link>
          </li>
          <li role="none">
            <Link
              role="menuitem"
              href={{ pathname: '/', hash: 'technology-stack' }}
              style={itemFont}
              className={itemClassName}
              onClick={(event) => goToHomeHash(event, 'technology-stack')}
            >
              {tTechStacks('sectionTitle')}
            </Link>
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
