import { animate, type AnimationPlaybackControls } from 'motion/react'

/** Matches `ThemeToggleAnimation`’s rendered height. */
export const NAVBAR_ICON_CONTROL_PX = 41.575

export const NAVBAR_ICON_GLYPH_PX = 28

/** How far the tile slides toward the viewport center. */
const NUDGE_PX = 8

/** Out and back, each half easing in and out. */
const SLIDE_DURATION_S = 0.2

export const navbarIconButtonClassName = [
  'inline-flex size-[41.575px] shrink-0 cursor-pointer items-center justify-center rounded',
  'border border-zinc-300 bg-white text-black',
  'shadow-[0_0_0_2px_transparent]',
  'outline-none transition-[color,background-color,box-shadow,border-color] duration-1000 ease-in-out',
  'focus-visible:border-zinc-500',
  'disabled:cursor-default disabled:opacity-60',
  'dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50',
  'dark:focus-visible:border-zinc-500',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:border-transparent',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-black',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:text-white',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_0_0_2px_#f0ece1]',
  'dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-50',
  'dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-950',
  'dark:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_0_0_2px_#ab8922]',
].join(' ')

let nudgeAnimation: AnimationPlaybackControls | null = null

/** Slides the icon and its box together toward the center of the viewport, then back. */
export function slideTileTowardCenter(
  tile: HTMLElement | null,
  reduceMotion: boolean
) {
  if (!tile || reduceMotion) return

  const rect = tile.getBoundingClientRect()
  const midpoint = rect.left + rect.width / 2
  const offset = midpoint < window.innerWidth / 2 ? NUDGE_PX : -NUDGE_PX

  nudgeAnimation?.stop()
  nudgeAnimation = animate(
    tile,
    { x: [0, offset, 0] },
    { duration: SLIDE_DURATION_S, ease: 'easeInOut' }
  )
}
