'use client'

import { ResponsivePie } from '@nivo/pie'
import { useInView } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export type DomainsPieDatum = {
  id: string
  label: string
  value: number
  color: string
}

type Props = {
  data: DomainsPieDatum[]
}

/** Desktop design size — everything scales from this proportionally. */
const DESIGN_WIDTH = 688 // 43rem
const DESIGN_HEIGHT = 380 // ~23.75rem
const DESIGN_MARGIN = { top: 40, right: 200, bottom: 40, left: 140 }
const DESIGN_FONT_SIZE = 19
const DESIGN_DIAGONAL = 16
const DESIGN_STRAIGHT = 20
const DESIGN_THICKNESS = 2
const DESIGN_ACTIVE_OFFSET = 8
const NARROW_VIEWPORT_PX = 500
const NARROW_SIZE_FACTOR = 0.85
const NARROW_FONT_SIZE = 10
const NARROW_INNER_RADIUS = 0.45
const DEFAULT_INNER_RADIUS = 0.5
/** Delay between revealing each pie slice once the chart is in view. */
const SLICE_STAGGER_MS = 180

function getLocaleFontFamily(locale: string) {
  if (locale === 'ar') return 'var(--font-arabic)'
  if (locale === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function DomainsPieChart({ data }: Props) {
  const t = useTranslations('DomainsPie')
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const root = document.documentElement

    function syncTheme() {
      setIsDark(root.classList.contains('dark'))
    }

    syncTheme()

    const themeObserver = new MutationObserver(syncTheme)
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => themeObserver.disconnect()
  }, [])

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${NARROW_VIEWPORT_PX - 1}px)`)

    function syncViewport() {
      setIsNarrowViewport(media.matches)
    }

    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const target: HTMLDivElement = node

    function measure() {
      const next = target.clientWidth
      if (next > 0) {
        setWidth(next)
      }
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(target)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView || data.length === 0) return

    let cancelled = false
    let timeoutId = 0

    if (prefersReducedMotion()) {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) setVisibleCount(data.length)
      }, 0)
      return () => {
        cancelled = true
        window.clearTimeout(timeoutId)
      }
    }

    let revealed = 0

    function revealNext() {
      if (cancelled) return
      revealed += 1
      setVisibleCount(revealed)
      if (revealed < data.length) {
        timeoutId = window.setTimeout(revealNext, SLICE_STAGGER_MS)
      }
    }

    timeoutId = window.setTimeout(revealNext, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isInView, data])

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const tooltipBg = isDark ? '#18181b' : '#ffffff'
  const tooltipText = isDark ? '#f4f4f5' : '#333333'
  const tooltipShadow = isDark
    ? '0 1px 2px rgba(0, 0, 0, 0.5)'
    : '0 1px 2px rgba(0, 0, 0, 0.25)'

  const baseScale = width == null ? 1 : Math.min(1, width / DESIGN_WIDTH)
  const scale = isNarrowViewport ? baseScale * NARROW_SIZE_FACTOR : baseScale
  const height = DESIGN_HEIGHT * scale
  const innerRadius = isNarrowViewport
    ? NARROW_INNER_RADIUS
    : DEFAULT_INNER_RADIUS
  // Reveal from the end of the array (Category7 → Category1).
  const visibleData =
    visibleCount > 0 ? data.slice(data.length - visibleCount) : []

  return (
    <div className="flex w-full max-w-172 flex-col gap-4 self-center">
      <h2
        className="text-center text-xl font-bold tracking-wide text-zinc-700 sm:text-[2.5rem] dark:text-zinc-50"
        style={{ fontFamily }}
      >
        {t('title')}
      </h2>
      <div
        ref={containerRef}
        dir="ltr"
        className="w-full overflow-visible"
        style={{ height }}
      >
        {width != null && width > 0 && visibleData.length > 0 ? (
          <ResponsivePie
            data={visibleData}
            margin={{
              top: DESIGN_MARGIN.top * scale,
              right: DESIGN_MARGIN.right * scale,
              bottom: DESIGN_MARGIN.bottom * scale,
              left: DESIGN_MARGIN.left * scale,
            }}
            innerRadius={innerRadius}
            startAngle={8}
            endAngle={368}
            padAngle={0.6}
            cornerRadius={2}
            activeOuterRadiusOffset={DESIGN_ACTIVE_OFFSET * scale}
            colors={{ datum: 'data.color' }}
            valueFormat={(value) => `${value}%`}
            animate
            motionConfig="gentle"
            transitionMode="startAngle"
            theme={{
              labels: {
                text: {
                  fontSize: isNarrowViewport
                    ? NARROW_FONT_SIZE
                    : Math.max(1, DESIGN_FONT_SIZE * scale),
                  fontFamily,
                  fill: labelTextColor,
                },
              },
              tooltip: {
                container: {
                  background: tooltipBg,
                  color: tooltipText,
                  boxShadow: tooltipShadow,
                  fontFamily,
                },
              },
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabel={(datum) => String(datum.label)}
            arcLinkLabelsTextColor={labelTextColor}
            arcLinkLabelsThickness={Math.max(1, DESIGN_THICKNESS * scale)}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLinkLabelsDiagonalLength={DESIGN_DIAGONAL * scale}
            arcLinkLabelsStraightLength={DESIGN_STRAIGHT * scale}
            enableArcLabels={!isNarrowViewport}
            arcLabelsSkipAngle={10}
            arcLabel={(datum) => `${datum.value}%`}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          />
        ) : null}
      </div>
    </div>
  )
}
