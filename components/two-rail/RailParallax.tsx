'use client'

import {
  frame,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from 'motion/react'
import Image from 'next/image'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type RefObject,
} from 'react'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { assetUrl } from '@/lib/assets'

export type ParallaxImage = {
  light: string
  dark: string
  alt: string
}

const ParallaxContext = createContext<ParallaxImage | null>(null)

export const ParallaxProvider = ParallaxContext.Provider

/** The layer overhangs its window, so translating it never exposes an edge. */
const OVERHANG = 'h-[130%]'

/**
 * Shared by the desktop rail and the mobile backdrop so both resolve to the
 * same source and the browser fetches the image once.
 */
const PARALLAX_SIZES = '(min-width: 800px) 50vw, 100vw'

export function ParallaxRail({
  image,
  scrollTarget,
}: {
  image: ParallaxImage
  scrollTarget: RefObject<HTMLElement | null>
}) {
  const reduceMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: scrollTarget,
    offset: ['start start', 'end end'],
  })
  // The rail is pinned, so the image has to travel up to trail the content
  // scrolling past it. A short distance reads as "far away".
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ['0%', '0%'] : ['0%', '-20%']
  )

  return (
    // Pins to the viewport top, not below the navbar, which slides away on scroll.
    <div className="pointer-events-none sticky top-0 z-0 hidden h-dvh w-1/2 overflow-hidden min-[800px]:block">
      <motion.div className={`relative w-full ${OVERHANG}`} style={{ y }}>
        <Image
          src={assetUrl(image.light)}
          alt={image.alt}
          fill
          sizes={PARALLAX_SIZES}
          // Same image is the LCP candidate at both breakpoints, so `loading`
          // and `fetchPriority` are preferred over `preload`.
          loading="eager"
          fetchPriority="high"
          // Abstract scrollwork: flip under RTL so the seam-facing edge
          // stays toward the center rail in Arabic and Hebrew.
          className="object-cover dark:hidden rtl:-scale-x-100"
        />
        <Image
          src={assetUrl(image.dark)}
          alt={image.alt}
          fill
          sizes={PARALLAX_SIZES}
          loading="eager"
          fetchPriority="high"
          className="hidden object-cover dark:block rtl:-scale-x-100"
        />
      </motion.div>
    </div>
  )
}

/**
 * Mobile-only backdrop for a rail cell. The cell is a window onto a
 * viewport-sized image that holds its place while the page scrolls past, the
 * way a distant mountain stays put when the foreground moves.
 *
 * `background-attachment: fixed` is the CSS equivalent but is unreliable on
 * mobile Safari, and a `fixed` child cannot be clipped by an `overflow: hidden`
 * parent, so the page scroll is cancelled out with a transform instead.
 */
export function RailCellBackdrop() {
  const image = useContext(ParallaxContext)
  const windowRef = useRef<HTMLDivElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const { scrollY } = useScroll()
  const windowTop = useMotionValue(0)

  const measure = useCallback(() => {
    const element = windowRef.current
    if (!element) return
    windowTop.set(element.getBoundingClientRect().top + window.scrollY)
  }, [windowTop])

  // Anything above this cell that grows after the first measurement leaves the
  // offset stale, which slides the image out of its window and exposes the page
  // behind it. Switching locales is the clearest case: the rails re-render with
  // copy of a different length and images reload behind their placeholders.
  useEffect(measure)

  useEffect(() => {
    const element = windowRef.current
    if (!element) return

    // `documentElement` is pinned to the viewport, so watch `body` to catch the
    // page growing as copy, fonts, and images settle.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    observer.observe(element)

    // A reflow that keeps the page the same height still moves this cell, and
    // only scrolling reveals it, so re-read the offset as the page moves.
    const remeasure = () => frame.read(measure)
    window.addEventListener('scroll', remeasure, { passive: true })
    // Chrome on Android resizes the visual viewport when the URL bar hides,
    // often without a `window` scroll event. Re-read so the window stays
    // aligned to that viewport.
    const visualViewport = window.visualViewport
    visualViewport?.addEventListener('resize', remeasure)
    visualViewport?.addEventListener('scroll', remeasure)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', remeasure)
      visualViewport?.removeEventListener('resize', remeasure)
      visualViewport?.removeEventListener('scroll', remeasure)
    }
  }, [measure])

  const y = useTransform(
    [scrollY, windowTop],
    ([scrolled, top]: number[]) => scrolled - top
  )

  if (!image) return null

  return (
    <div
      ref={windowRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden min-[800px]:hidden"
    >
      <motion.div
        // Anchored to the viewport's top edge, so it covers whatever slice of
        // the cell is on screen.
        className={
          // `lvh` is the viewport with mobile chrome hidden. It stays put
          // while scrolling (unlike `dvh`, which resizes the object-cover
          // crop) and is tall enough to cover the cell after the toolbar
          // tucks away (unlike `svh`, which leaves a zinc gap at the bottom).
          reduceMotion ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-lvh'
        }
        style={reduceMotion ? undefined : { y }}
      >
        <Image
          // Same resolved sources as the rail images, so this costs no extra fetch.
          src={assetUrl(image.light)}
          alt=""
          fill
          sizes={PARALLAX_SIZES}
          loading="eager"
          className="object-cover dark:hidden rtl:-scale-x-100"
        />
        <Image
          src={assetUrl(image.dark)}
          alt=""
          fill
          sizes={PARALLAX_SIZES}
          loading="eager"
          className="hidden object-cover dark:block rtl:-scale-x-100"
        />
      </motion.div>
    </div>
  )
}
