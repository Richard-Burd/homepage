'use client'

import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { proxiedAssetUrl } from '@/lib/assets'
import {
  getResolvedTheme,
  getServerThemeSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme'

const ANIMATION_FILE = 'light-dark-mode-button.json'
const TOGGLE_SIZE = { width: 74.295, height: 41.575 } as const

/**
 * The file's in-point is -1, but lottie-web initializes renderedFrame to -1
 * and skips a render when the target matches that sentinel — so the sun never
 * paints on first load. Frame 0 is the same sun. Last drawn moon is 38;
 * frames 39–40 have no layer. Segment end is exclusive.
 *
 * The control shows the destination theme (moon while in light, sun while in
 * dark) so it reads as "click to switch to this".
 */
const SUN_FRAME = 0
const MOON_FRAME = 38
const PLAYABLE_SEGMENT: [number, number] = [SUN_FRAME, MOON_FRAME + 1]

function frameForTheme(theme: Theme) {
  return theme === 'light' ? MOON_FRAME : SUN_FRAME
}

function snapToTheme(api: LottieRefCurrentProps, theme: Theme) {
  api.goToAndStop(frameForTheme(theme), true)
}

export default function ThemeToggleAnimation() {
  const t = useTranslations('ThemeSwitcher')
  const theme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerThemeSnapshot
  )
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const isReadyRef = useRef(false)
  const reduceMotion = usePrefersReducedMotion()
  const reduceMotionRef = useRef(reduceMotion)

  useEffect(() => {
    reduceMotionRef.current = reduceMotion
  }, [reduceMotion])

  const [animationData, setAnimationData] = useState<object | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(proxiedAssetUrl(ANIMATION_FILE))
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation')
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data)
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

    if (reduceMotionRef.current) {
      snapToTheme(api, theme)
      return
    }

    api.setDirection(theme === 'light' ? 1 : -1)
    api.play()
  }, [theme])

  function handleDomLoaded() {
    const api = lottieRef.current
    if (!api) return

    isReadyRef.current = true
    api.setSubframe(false)
    snapToTheme(api, theme)
  }

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      aria-label={t('label')}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      style={TOGGLE_SIZE}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:focus-visible:ring-zinc-300"
    >
      {animationData ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          initialSegment={PLAYABLE_SEGMENT}
          autoplay={false}
          loop={false}
          onDOMLoaded={handleDomLoaded}
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
