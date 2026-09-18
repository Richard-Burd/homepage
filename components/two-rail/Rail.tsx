'use client'

import { Children, type CSSProperties, type ReactNode } from 'react'

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
  /**
   * How the cell reads once the rails stack. `heading` keeps the parallax
   * backdrop it shares with the desktop rail; `prose` drops it and picks up
   * the end rail's paragraph padding so the text reads as body copy.
   */
  mobile?: 'heading' | 'prose'
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
  mobile = 'heading',
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
      // Only the page title leaves the shift non-zero, moving its tick,
      // marker, and text down together.
      style={
        tick && tickLevel === 'page'
          ? ({
              '--rail-tick-shift': 'var(--rail-page-title-shift)',
            } as CSSProperties)
          : undefined
      }
      className={`relative overflow-hidden min-[800px]:overflow-visible min-[800px]:pe-(--rail-text-clearance) ${
        empty ? 'hidden min-[800px]:flex' : 'flex'
      } ${align === 'center' ? 'items-center' : 'items-start'} ${
        // Stacked, prose cells share the end rail's surface so a description
        // doesn't sit on the page zinc while the copy around it is white/black.
        mobile === 'prose' && hasContent
          ? 'max-[799px]:bg-white max-[799px]:dark:bg-black'
          : ''
      } ${className ?? ''}`}
    >
      {hasContent && mobile === 'heading' ? <RailCellBackdrop /> : null}
      <LeaderSpine variant={spine} endAnchor={endAnchor} />
      {tick ? <LeaderTick /> : null}
      {hasContent ? (
        // The cell's own end padding holds the line clearance, so the inner
        // box only pads the outer edge on desktop.
        <div
          className={`relative z-10 w-full px-4 min-[800px]:ps-8 min-[800px]:pe-0 min-[800px]:pt-[calc(var(--rail-cell-pad-top)+var(--rail-tick-shift))] min-[800px]:pb-8 ${
            // Section titles keep a taller parallax band above and below the
            // heading once the rails stack. The page title stays on py-6.
            mobile === 'heading' && tickLevel !== 'page'
              ? 'py-[calc(1.5rem*1.3)]'
              : 'py-6'
          } ${
            // Below the split, prose cells take the end rail's paragraph
            // padding so both columns share one text margin.
            mobile === 'prose'
              ? 'max-[799px]:px-6 max-[799px]:py-8 md:max-[799px]:px-10'
              : ''
          } ${lift}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function RailEnd({
  children,
  sectionEnd = false,
  className,
}: {
  children: ReactNode
  /**
   * Adds the gap that closes out a section. Cells within a section stay flush
   * so the next cell's backdrop butts right up against them.
   */
  sectionEnd?: boolean
  className?: string
}) {
  return (
    <div
      className={`bg-white dark:bg-black ${
        sectionEnd ? 'pb-8' : 'pb-0'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
