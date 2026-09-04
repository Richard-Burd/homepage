'use client'

import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'

import { usePrefersReducedMotion, useIsCoarsePointer } from '@/components/pie-and-bar-chart-combo/shared'
import { proxiedAssetUrl } from '@/lib/assets'
import {
  getResolvedTheme,
  getServerThemeSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme'

const ANIMATION_FILE = 'light-dark-mode-button.3.json'
const TOGGLE_SIZE = { width: 74.295, height: 41.575 } as const

/**
 * Frame layout (composition op = 60; segment ends are exclusive):
 * - Dark-mode hover loop: 0–7
 * - Sun ↔ moon transition: 7–50
 * - Light-mode hover loop: 50–59
 *
 * The control shows the destination theme (moon while in light, sun while in
 * dark) so it reads as "click to switch to this". Resting poses sit at the
 * hover↔transition boundaries.
 */
const DARK_MODE_HOVER_START_FRAME = 0
const DARK_MODE_HOVER_END_FRAME = 7
const LIGHT_MODE_HOVER_START_FRAME = 50
const LIGHT_MODE_HOVER_END_FRAME = 58

const SUN_FRAME = DARK_MODE_HOVER_END_FRAME
const MOON_FRAME = LIGHT_MODE_HOVER_START_FRAME
const TRANSITION_ANIMATION: [number, number] = [
  DARK_MODE_HOVER_END_FRAME,
  LIGHT_MODE_HOVER_START_FRAME + 1,
]
/** Apply document theme when the toggle morph is halfway done. */
const THEME_SWAP_AT_PROGRESS = 0.5

/**
 * Cavalry morph leftovers: moon/sun shapes collapsed to a single point still
 * keep stroke width, which paints as tiny white dots on the dark pill.
 */
const COLLAPSED_PATH_EPS = 0.05

function pathSpan(vertices: number[][]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of vertices) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return Math.max(maxX - minX, maxY - minY)
}

function hideCollapsedShapes(node: unknown): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) hideCollapsedShapes(child)
    return
  }

  const obj = node as Record<string, unknown>
  if (obj.ty === 'gr' && Array.isArray(obj.it)) {
    const items = obj.it as Record<string, unknown>[]
    const shape = items.find((item) => item.ty === 'sh') as
      { ks?: { k?: { v?: number[][] } } } | undefined
    const vertices = shape?.ks?.k?.v
    if (vertices && pathSpan(vertices) < COLLAPSED_PATH_EPS) {
      for (const item of items) {
        if (item.ty === 'fl' || item.ty === 'st') {
          const opacity = item.o as { k?: number } | undefined
          if (opacity && typeof opacity.k === 'number') opacity.k = 0
        }
        if (item.ty === 'st') {
          const width = item.w as { k?: number } | undefined
          if (width && typeof width.k === 'number') width.k = 0
        }
        if (item.ty === 'tr') {
          const opacity = item.o as { k?: number } | undefined
          if (opacity && typeof opacity.k === 'number') opacity.k = 0
        }
      }
    }
  }

  for (const value of Object.values(obj)) hideCollapsedShapes(value)
}

function sanitizeThemeToggleAnimation(data: object) {
  hideCollapsedShapes(data)
  return data
}

function frameForTheme(theme: Theme) {
  return theme === 'light' ? MOON_FRAME : SUN_FRAME
}

function hoverSegmentForTheme(theme: Theme): [number, number] {
  return theme === 'dark'
    ? [DARK_MODE_HOVER_START_FRAME, DARK_MODE_HOVER_END_FRAME + 1]
    : [LIGHT_MODE_HOVER_START_FRAME, LIGHT_MODE_HOVER_END_FRAME + 1]
}

function snapToTheme(api: LottieRefCurrentProps, theme: Theme) {
  const absoluteFrame = frameForTheme(theme)
  const item = api.animationItem

  if (item) {
    item.loop = false
    item.pause()
    // playSegments leaves firstFrame at the hover segment start; goToAndStop is
    // relative to that, so restore the transition segment before seeking.
    item.setSegment(TRANSITION_ANIMATION[0], TRANSITION_ANIMATION[1])
    api.goToAndStop(absoluteFrame - TRANSITION_ANIMATION[0], true)
    return
  }

  api.goToAndStop(absoluteFrame, true)
}

export default function ThemeToggleAnimation({
  lightBorderColor,
  darkBorderColor,
}: {
  lightBorderColor: string
  darkBorderColor: string
}) {
  const t = useTranslations('ThemeSwitcher')
  const theme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerThemeSnapshot
  )
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const isReadyRef = useRef(false)
  const isHoveringRef = useRef(false)
  const isTransitioningRef = useRef(false)
  const pendingThemeRef = useRef<Theme | null>(null)
  const themeAppliedMidwayRef = useRef(false)
  const themeRef = useRef(theme)
  const reduceMotion = usePrefersReducedMotion()
  const reduceMotionRef = useRef(reduceMotion)
  const isCoarsePointer = useIsCoarsePointer()
  const isCoarsePointerRef = useRef(isCoarsePointer)

  useEffect(() => {
    reduceMotionRef.current = reduceMotion
  }, [reduceMotion])

  useEffect(() => {
    isCoarsePointerRef.current = isCoarsePointer
    // Touch can leave a sticky mouseenter; drop hover if we switch to coarse.
    if (isCoarsePointer) isHoveringRef.current = false
  }, [isCoarsePointer])

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  const [animationData, setAnimationData] = useState<object | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(proxiedAssetUrl(ANIMATION_FILE))
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation')
        return response.json()
      })
      .then((data: object) => {
        if (!cancelled) setAnimationData(sanitizeThemeToggleAnimation(data))
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReadyRef.current) return

    const api = lottieRef.current
    if (!api) return

    // Click-driven morph already owns playback; don't restart when theme flips mid-way.
    if (isTransitioningRef.current) return

    if (reduceMotionRef.current) {
      if (api.animationItem) api.animationItem.loop = false
      snapToTheme(api, theme)
      return
    }

    isTransitioningRef.current = true
    if (api.animationItem) api.animationItem.loop = false
    api.playSegments(
      theme === 'light'
        ? TRANSITION_ANIMATION
        : [TRANSITION_ANIMATION[1], TRANSITION_ANIMATION[0]],
      true
    )
  }, [theme])

  function handleDomLoaded() {
    const api = lottieRef.current
    if (!api) return

    isReadyRef.current = true
    api.setSubframe(false)
    snapToTheme(api, theme)
  }

  function playHoverLoop() {
    const api = lottieRef.current
    if (!api || reduceMotionRef.current || isCoarsePointerRef.current) return

    if (api.animationItem) api.animationItem.loop = true
    api.setDirection(1)
    api.playSegments(hoverSegmentForTheme(themeRef.current), true)
  }

  function applyPendingThemeIfNeeded() {
    const pending = pendingThemeRef.current
    if (!pending) return
    pendingThemeRef.current = null
    themeAppliedMidwayRef.current = true
    setTheme(pending)
  }

  function handleEnterFrame() {
    if (!pendingThemeRef.current || themeAppliedMidwayRef.current) return

    const item = lottieRef.current?.animationItem
    if (!item || item.totalFrames <= 0) return

    const rawProgress = item.currentRawFrame / item.totalFrames
    // Reverse morphs count down through the segment.
    const progress = item.playDirection < 0 ? 1 - rawProgress : rawProgress

    if (progress >= THEME_SWAP_AT_PROGRESS) {
      applyPendingThemeIfNeeded()
    }
  }

  function handleComplete() {
    // Safety net if enter-frame skipped the midpoint (e.g. very fast seek).
    applyPendingThemeIfNeeded()
    isTransitioningRef.current = false
    themeAppliedMidwayRef.current = false

    if (
      !isHoveringRef.current ||
      reduceMotionRef.current ||
      isCoarsePointerRef.current
    ) {
      return
    }
    playHoverLoop()
  }

  function handleMouseEnter() {
    // Phones synthesize mouseenter on tap and keep it until another tap elsewhere.
    if (
      !isReadyRef.current ||
      reduceMotionRef.current ||
      isCoarsePointerRef.current
    ) {
      return
    }
    isHoveringRef.current = true
    if (isTransitioningRef.current) return
    playHoverLoop()
  }

  function handleMouseLeave() {
    isHoveringRef.current = false

    const api = lottieRef.current
    if (!api || isTransitioningRef.current) return

    if (api.animationItem) api.animationItem.loop = false
    snapToTheme(api, themeRef.current)
  }

  function toggleTheme() {
    if (isTransitioningRef.current) return

    // Clear sticky touch-hover so the idle loop doesn't start after the morph.
    if (isCoarsePointerRef.current) isHoveringRef.current = false

    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    if (reduceMotionRef.current || !isReadyRef.current) {
      setTheme(nextTheme)
      return
    }

    const api = lottieRef.current
    if (!api) {
      setTheme(nextTheme)
      return
    }

    pendingThemeRef.current = nextTheme
    themeAppliedMidwayRef.current = false
    isTransitioningRef.current = true
    if (api.animationItem) api.animationItem.loop = false
    api.playSegments(
      nextTheme === 'light'
        ? TRANSITION_ANIMATION
        : [TRANSITION_ANIMATION[1], TRANSITION_ANIMATION[0]],
      true
    )
  }

  return (
    <button
      type="button"
      aria-label={t('label')}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        {
          ...TOGGLE_SIZE,
          '--toggle-border-light': lightBorderColor,
          '--toggle-border-dark': darkBorderColor,
        } as CSSProperties
      }
      className="inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent p-0 shadow-[0_0_0_2px_transparent] outline-none transition-shadow duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_0_0_2px_var(--toggle-border-light)] focus-visible:ring-2 focus-visible:ring-zinc-500 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_0_0_2px_var(--toggle-border-dark)] dark:focus-visible:ring-offset-zinc-950"
    >
      {animationData ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          initialSegment={TRANSITION_ANIMATION}
          autoplay={false}
          loop={false}
          onDOMLoaded={handleDomLoaded}
          onEnterFrame={handleEnterFrame}
          onComplete={handleComplete}
          aria-hidden
          className="pointer-events-none size-full"
        />
      ) : loadError ? null : (
        <span
          className="block size-full animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-600"
          aria-hidden
        />
      )}
    </button>
  )
}
