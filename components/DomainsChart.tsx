'use client'

import { ResponsivePie } from '@nivo/pie'
import { useInView } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

export type DomainsChartDatum = {
  id: string
  label: string
  value: number
  color: string
}

type Props = {
  data: DomainsChartDatum[]
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
const DEFAULT_INNER_RADIUS = 0.5

/** Mobile vertical (“unwrapped pie”) stacked column. */
const NARROW_VIEWPORT_PX = 500
const NARROW_HEIGHT = 420
const NARROW_MARGIN = { top: 12, right: 8, bottom: 12, left: 20 }
const NARROW_COLUMN_WIDTH = 40
const NARROW_FONT_SIZE = 16
const NARROW_LINK_GAP = 8
const NARROW_LINK_LENGTH = 14
const NARROW_THICKNESS = 2
const NARROW_CORNER = 3
const NARROW_SEGMENT_GAP = 3

/** Delay between revealing each slice/segment once the chart is in view. */
const SLICE_STAGGER_MS = 180

type SegmentLayout = DomainsChartDatum & {
  y: number
  height: number
  midY: number
}

function getLocaleFontFamily(locale: string) {
  if (locale === 'ar') return 'var(--font-arabic)'
  if (locale === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function darkenHex(hex: string, amount = 0.45) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return hex
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16)
    return Math.round(value * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(2)}${channel(4)}`
}

function layoutSegments(
  data: DomainsChartDatum[],
  plotTop: number,
  plotHeight: number,
  gap: number
): SegmentLayout[] {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0 || data.length === 0) return []

  const gapTotal = gap * Math.max(0, data.length - 1)
  const usable = Math.max(0, plotHeight - gapTotal)
  let cursor = plotTop

  return data.map((datum, index) => {
    const height = (datum.value / total) * usable
    const y = cursor
    cursor += height + (index < data.length - 1 ? gap : 0)
    return { ...datum, y, height, midY: y + height / 2 }
  })
}

export default function DomainsChart({ data }: Props) {
  const t = useTranslations('DomainsPie')
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

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

  // Reveal from the end of the array (Category7 → Category1).
  const visibleData =
    visibleCount > 0 ? data.slice(data.length - visibleCount) : []

  const pieScale = width == null ? 1 : Math.min(1, width / DESIGN_WIDTH)
  const pieHeight = DESIGN_HEIGHT * pieScale

  const barHeight = NARROW_HEIGHT
  const barMargin = NARROW_MARGIN
  const columnWidth = NARROW_COLUMN_WIDTH
  const fontSize = NARROW_FONT_SIZE
  const linkGap = NARROW_LINK_GAP
  const linkLength = NARROW_LINK_LENGTH
  const thickness = NARROW_THICKNESS
  const corner = NARROW_CORNER
  const segmentGap = NARROW_SEGMENT_GAP

  const chartWidth = width ?? DESIGN_WIDTH
  const plotHeight = Math.max(0, barHeight - barMargin.top - barMargin.bottom)
  const columnX = barMargin.left
  const labelAnchorX = columnX + columnWidth + linkGap + linkLength

  const segments = useMemo(() => {
    // Reveal from the end of the array (Category7 → Category1).
    const visible =
      visibleCount > 0 ? data.slice(data.length - visibleCount) : []
    return layoutSegments(visible, barMargin.top, plotHeight, segmentGap)
  }, [data, visibleCount, barMargin.top, plotHeight, segmentGap])

  const hovered = hoveredId
    ? segments.find((segment) => segment.id === hoveredId)
    : undefined

  const height = isNarrowViewport ? barHeight : pieHeight

  return (
    <div className="flex w-full max-w-172 flex-col gap-4 self-center">
      <h2
        className="text-center text-2xl font-bold tracking-wide text-zinc-700 sm:text-[2.5rem] dark:text-zinc-50"
        style={{ fontFamily }}
      >
        {t('title')}
      </h2>
      <div
        ref={containerRef}
        dir="ltr"
        className="relative w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHoveredId(null)}
      >
        {width != null && width > 0 && visibleData.length > 0 ? (
          isNarrowViewport ? (
            <>
              <svg
                width={chartWidth}
                height={barHeight}
                viewBox={`0 0 ${chartWidth} ${barHeight}`}
                role="img"
                aria-label={t('title')}
              >
                {segments.map((segment) => {
                  const linkStartX = columnX + columnWidth
                  const linkElbowX = linkStartX + linkGap
                  const linkEndX = labelAnchorX
                  const isHovered = hoveredId === segment.id

                  return (
                    <g
                      key={segment.id}
                      onMouseEnter={() => setHoveredId(segment.id)}
                      style={{ cursor: 'default' }}
                    >
                      <rect
                        x={columnX}
                        y={segment.y}
                        width={columnWidth}
                        height={Math.max(0, segment.height)}
                        rx={corner}
                        ry={corner}
                        fill={segment.color}
                        opacity={hoveredId && !isHovered ? 0.55 : 1}
                      />
                      {segment.height > fontSize * 1.4 ? (
                        <text
                          x={columnX + columnWidth / 2}
                          y={segment.midY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={darkenHex(segment.color)}
                          fontFamily={fontFamily}
                          fontSize={fontSize * 0.85}
                          style={{ pointerEvents: 'none' }}
                        >
                          {`${segment.value}%`}
                        </text>
                      ) : null}
                      <path
                        d={`M ${linkStartX} ${segment.midY} L ${linkElbowX} ${segment.midY} L ${linkEndX} ${segment.midY}`}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={thickness}
                        opacity={hoveredId && !isHovered ? 0.4 : 1}
                      />
                      <text
                        x={linkEndX + 6}
                        y={segment.midY}
                        dominantBaseline="central"
                        fill={labelTextColor}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        opacity={hoveredId && !isHovered ? 0.55 : 1}
                      >
                        {segment.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {hovered ? (
                <div
                  className="pointer-events-none absolute z-10 rounded px-3 py-2 text-sm shadow"
                  style={{
                    left: columnX + columnWidth + 12,
                    top: Math.max(8, hovered.midY - 20),
                    background: tooltipBg,
                    color: tooltipText,
                    boxShadow: tooltipShadow,
                    fontFamily,
                  }}
                >
                  <strong style={{ color: hovered.color }}>
                    {hovered.label}
                  </strong>
                  {`: ${hovered.value}%`}
                </div>
              ) : null}
            </>
          ) : (
            <ResponsivePie
              data={visibleData}
              margin={{
                top: DESIGN_MARGIN.top * pieScale,
                right: DESIGN_MARGIN.right * pieScale,
                bottom: DESIGN_MARGIN.bottom * pieScale,
                left: DESIGN_MARGIN.left * pieScale,
              }}
              innerRadius={DEFAULT_INNER_RADIUS}
              startAngle={8}
              endAngle={368}
              padAngle={0.6}
              cornerRadius={2}
              activeOuterRadiusOffset={DESIGN_ACTIVE_OFFSET * pieScale}
              colors={{ datum: 'data.color' }}
              valueFormat={(value) => `${value}%`}
              animate
              motionConfig="gentle"
              transitionMode="startAngle"
              theme={{
                labels: {
                  text: {
                    fontSize: Math.max(1, DESIGN_FONT_SIZE * pieScale),
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
              arcLinkLabelsThickness={Math.max(1, DESIGN_THICKNESS * pieScale)}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLinkLabelsDiagonalLength={DESIGN_DIAGONAL * pieScale}
              arcLinkLabelsStraightLength={DESIGN_STRAIGHT * pieScale}
              enableArcLabels
              arcLabelsSkipAngle={10}
              arcLabel={(datum) => `${datum.value}%`}
              arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2]],
              }}
            />
          )
        ) : null}
      </div>
    </div>
  )
}
