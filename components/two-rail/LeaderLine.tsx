import type { CSSProperties } from 'react'

/**
 * `start` begins at the page title's tick, `end` stops at the first line of the
 * final row, and `full` spans the cell so stacked rows read as one line.
 */
export type SpineVariant = 'full' | 'start' | 'end'

export type EndAnchor = 'text' | 'media'

/**
 * Where the leader line meets the first line of a row's content. Each value is
 * the row's top padding plus half the first line box, so ticks and the spine
 * endpoints all land on the same baseline. Override per page when the type
 * scale differs.
 */
export type RailAnchors = {
  title?: string
  text?: string
  media?: string
  /** Per-page override for `PAGE_TITLE_OFFSET`. */
  pageTitleOffset?: string
}

/** Leader line thickness. Half of it centers a line on its anchor. */
const LINE_THICKNESS_PX = 4

/** Marker that caps the tick where it meets the text. */
const MARKER_SIZE_PX = 16
const MARKER_SHAPE: 'circle' | 'square' = 'circle'

/**
 * Horizontal space between the end of a tick and the text it points at.
 * Raise it to push rail text further from the leader lines.
 */
const TEXT_GAP_PX = 20

/**
 * Tick geometry, shared so the marker can sit at the tick's tip. `INSET` is the
 * distance from the rail's inline end to the spine; `LENGTH` is how far the
 * tick reaches toward the text.
 */
const TICK_INSET = '2.5rem'
const TICK_LENGTH = '2rem'

/**
 * Lowers a section's tick, marker, and heading text together, so the tick
 * lines up with the first line of the paragraph it points at on the right
 * rail. Raise it if the rail's type scale grows. The page title sets its own
 * position through `PAGE_TITLE_OFFSET` and ignores this.
 */
const TICK_DROP_PX = 8

/**
 * A tick sits at a fixed offset from the top of its cell, but a heading's
 * first line centers at half its own line box, which is taller. These lift the
 * text so its first line centers on the tick; retune them if the type scale or
 * font changes. One per heading level, since their line boxes differ.
 */
const TITLE_LIFT_PX = 10
const PAGE_TITLE_LIFT_PX = 15

/**
 * Distance from the top of the viewport, navbar included, down to the page
 * title's first line and its tick. Raise it to sit the title lower against a
 * taller hero image. Pages can override it with the `pageTitleOffset` anchor.
 */
const PAGE_TITLE_OFFSET = '500px'

export const defaultRailAnchors: Required<RailAnchors> = {
  // Rail cell py-8 (2rem) + half of a heading line.
  title: '2.65rem',
  // Paragraph py-8 (2rem) + half of leading-loose at 1.125rem (1.125rem).
  text: '3.125rem',
  // Image wrapper py-6.
  media: '1.5rem',
  pageTitleOffset: PAGE_TITLE_OFFSET,
}

/** Rail cell content padding on desktop, the baseline a shift adds to. */
const CELL_PAD_TOP = '2rem'

export function railAnchorStyle(anchors?: RailAnchors) {
  const merged = { ...defaultRailAnchors, ...anchors }
  return {
    '--rail-title-anchor': merged.title,
    '--rail-text-anchor': merged.text,
    '--rail-media-anchor': merged.media,
    '--rail-line': `${LINE_THICKNESS_PX}px`,
    '--rail-line-half': `${LINE_THICKNESS_PX / 2}px`,
    '--rail-marker': `${MARKER_SIZE_PX}px`,
    '--rail-marker-half': `${MARKER_SIZE_PX / 2}px`,
    '--rail-title-lift': `${TITLE_LIFT_PX}px`,
    '--rail-page-title-lift': `${PAGE_TITLE_LIFT_PX}px`,
    '--rail-tick-inset': TICK_INSET,
    '--rail-tick-length': TICK_LENGTH,
    '--rail-cell-pad-top': CELL_PAD_TOP,
    // Cells move their tick, marker, and text down by this. Only the page
    // title overrides it, with the shift below.
    '--rail-tick-shift': `${TICK_DROP_PX}px`,
    // What the page title has to travel to land at its offset, measured from
    // the cell's top, which starts under the navbar.
    '--rail-page-title-shift': `calc(${merged.pageTitleOffset} - var(--navbar-height, 4.15rem) - ${merged.title})`,
    // How far rail text must stay clear of the line, so it tracks every part
    // of the geometry above rather than just the inset.
    '--rail-text-clearance': `calc(${TICK_INSET} + ${TICK_LENGTH} + ${MARKER_SIZE_PX}px + ${TEXT_GAP_PX}px)`,
  } as CSSProperties
}

export function LeaderSpine({
  variant,
  endAnchor,
}: {
  variant: SpineVariant
  endAnchor: EndAnchor
}) {
  // Each endpoint is pulled back by half the thickness so the line stays
  // centered on its anchor rather than starting below it.
  const extent =
    variant === 'start'
      ? 'top-[calc(var(--rail-title-anchor)+var(--rail-tick-shift)-var(--rail-line-half))] bottom-0'
      : variant === 'end'
        ? `top-0 ${
            endAnchor === 'media'
              ? 'h-[calc(var(--rail-media-anchor)+var(--rail-line-half))]'
              : 'h-[calc(var(--rail-text-anchor)+var(--rail-line-half))]'
          }`
        : 'inset-y-0'

  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-e-(--rail-tick-inset) z-20 hidden w-(--rail-line) bg-zinc-900 min-[800px]:block dark:bg-zinc-100 ${extent}`}
      />
      {variant === 'end' ? (
        // Straddles the spine's own axis so the line runs into its center.
        <LeaderMarker
          position={`inset-e-[calc(var(--rail-tick-inset)+var(--rail-line-half)-var(--rail-marker-half))] ${
            endAnchor === 'media'
              ? 'top-[calc(var(--rail-media-anchor)-var(--rail-marker-half))]'
              : 'top-[calc(var(--rail-text-anchor)-var(--rail-marker-half))]'
          }`}
        />
      ) : null}
    </>
  )
}

export function LeaderTick() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-e-(--rail-tick-inset) top-[calc(var(--rail-title-anchor)+var(--rail-tick-shift)-var(--rail-line-half))] z-20 hidden h-(--rail-line) w-(--rail-tick-length) bg-zinc-900 min-[800px]:block dark:bg-zinc-100"
      />
      {/* Logical inset keeps this past the tick's tip in both LTR and RTL. */}
      <LeaderMarker position="inset-e-[calc(var(--rail-tick-inset)+var(--rail-tick-length))] top-[calc(var(--rail-title-anchor)+var(--rail-tick-shift)-var(--rail-marker-half))]" />
    </>
  )
}

function LeaderMarker({ position }: { position: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-20 hidden size-(--rail-marker) bg-zinc-900 min-[800px]:block dark:bg-zinc-100 ${
        MARKER_SHAPE === 'circle' ? 'rounded-full' : 'rounded-none'
      } ${position}`}
    />
  )
}
