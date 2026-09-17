'use client'

import { Children, type ReactNode } from 'react'

import {
  LeaderSpine,
  LeaderTick,
  type EndAnchor,
  type SpineVariant,
} from '@/components/two-rail/LeaderLine'
import { RailCellBackdrop } from '@/components/two-rail/RailParallax'

type RailStartProps = {
  children?: ReactNode
  tick?: boolean
  /** Which heading level the tick points at, since their line boxes differ. */
  tickLevel?: 'section' | 'page'
  align?: 'start' | 'center'
  hideWhenEmpty?: boolean
  spine?: SpineVariant
  endAnchor?: EndAnchor
  className?: string
}

// Children.toArray drops null, undefined, and booleans.
function hasRenderableChildren(children: ReactNode) {
  return Children.toArray(children).length > 0
}

export function RailStart({
  children,
  tick = false,
  tickLevel = 'section',
  align = 'start',
  hideWhenEmpty = false,
  spine = 'full',
  endAnchor = 'text',
  className,
}: RailStartProps) {
  const hasContent = hasRenderableChildren(children)
  const empty = hideWhenEmpty && !hasContent
  // Only a cell with a tick has something to line its first text line up with.
  const lift = !tick
    ? ''
    : tickLevel === 'page'
      ? 'min-[800px]:-mt-(--rail-page-title-lift)'
      : 'min-[800px]:-mt-(--rail-title-lift)'

  return (
    <div
      className={`relative overflow-hidden min-[800px]:overflow-visible min-[800px]:pe-(--rail-text-clearance) ${
        empty ? 'hidden min-[800px]:flex' : 'flex'
      } ${align === 'center' ? 'items-center' : 'items-start'} ${
        className ?? ''
      }`}
    >
      {hasContent ? <RailCellBackdrop /> : null}
      <LeaderSpine variant={spine} endAnchor={endAnchor} />
      {tick ? <LeaderTick /> : null}
      {hasContent ? (
        // The cell's own end padding holds the line clearance, so the inner
        // box only pads the outer edge on desktop.
        <div
          className={`relative z-10 w-full px-4 py-6 min-[800px]:py-8 min-[800px]:ps-8 min-[800px]:pe-0 ${lift}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function RailEnd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-zinc-200 pb-3 min-[800px]:pb-4 dark:bg-zinc-800 ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  )
}
