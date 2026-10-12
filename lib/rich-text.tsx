import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

/** Shared class for rich-text anchors in message strings. */
export const richLinkClassName = 'text-blue-600 underline dark:text-blue-400'

/** A next-intl `t.rich()` tag renderer. The map key must match the message tag. */
export type RichTagFn = (chunks: ReactNode) => ReactNode

export type RichTagMap = Record<string, RichTagFn>

export function externalRichLink(href: string, dir?: 'ltr' | 'rtl'): RichTagFn {
  function ExternalRichLink(chunks: ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={richLinkClassName}
        dir={dir}
      >
        {chunks}
      </a>
    )
  }

  return ExternalRichLink
}

export function internalRichLink(href: string): RichTagFn {
  function InternalRichLink(chunks: ReactNode) {
    return (
      <Link href={href} className={richLinkClassName}>
        {chunks}
      </Link>
    )
  }

  return InternalRichLink
}

export function homeHashRichLink(hash: string): RichTagFn {
  function HomeHashRichLink(chunks: ReactNode) {
    return (
      <Link href={{ pathname: '/', hash }} className={richLinkClassName}>
        {chunks}
      </Link>
    )
  }

  return HomeHashRichLink
}

export function boldRichTag(chunks: ReactNode) {
  return <b>{chunks}</b>
}

export function italicRichTag(chunks: ReactNode) {
  return <i>{chunks}</i>
}
