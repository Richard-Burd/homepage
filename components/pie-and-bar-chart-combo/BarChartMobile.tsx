'use client'

import { motion, useInView } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  darkenHex,
  getLocaleFontFamily,
  layoutSegments,
  useIsDarkMode,
  usePrefersReducedMotion,
} from './shared'
import type { DomainsChartDatum } from './types'

const TITLE_FONT_SIZE = 24
const HEIGHT = 420
const MARGIN = { top: 12, right: 8, bottom: 12, left: 20 }
const COLUMN_WIDTH = 40
const LABELS_FONT_SIZE = 16
const LINK_GAP = 8
const LINK_LENGTH = 14
const LEADER_ARM_THICKNESS = 2
const BAR_SEGMENT_CORNER = 3
const GAP_BETWEEN_BAR_SEGMENTS = 3
/** How far a hovered segment stretches to the right (mirrors pie activeOuterRadiusOffset). */
const OFFSET_WHEN_SELECTED = 12
/** Bottom → top entrance: travel + stagger between segments. */
const BAR_ENTER_OFFSET_Y = 40
const BAR_ENTER_DURATION_S = 0.55
const BAR_ENTER_STAGGER_S = 0.1
/** How far the title starts below its final spot before rising into place. */
const TITLE_ENTER_OFFSET_Y = 900
/** Title entrance duration in seconds — higher = slower rise/fade. */
const TITLE_ENTER_DURATION_S = 1.3

type Props = {
  data: DomainsChartDatum[]
}

/** Biggest segment on top, smallest on bottom — mobile bar only. */
function stackLargestOnTop(data: DomainsChartDatum[]): DomainsChartDatum[] {
  return [...data].sort((a, b) => b.value - a.value)
}

export default function BarChartMobile({ data }: Props) {
  const t = useTranslations('DomainsPie')
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const isDark = useIsDarkMode()
  const reduceMotion = usePrefersReducedMotion()

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

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const barHeight = HEIGHT
  const barMargin = MARGIN
  const columnWidth = COLUMN_WIDTH
  const fontSize = LABELS_FONT_SIZE
  const linkGap = LINK_GAP
  const linkLength = LINK_LENGTH
  const thickness = LEADER_ARM_THICKNESS
  const corner = BAR_SEGMENT_CORNER
  const segmentGap = GAP_BETWEEN_BAR_SEGMENTS

  const chartWidth = width ?? 320
  const plotHeight = Math.max(0, barHeight - barMargin.top - barMargin.bottom)
  const columnX = barMargin.left
  const labelAnchorX = columnX + columnWidth + linkGap + linkLength

  const barSegments = useMemo(
    () =>
      layoutSegments(
        stackLargestOnTop(data),
        barMargin.top,
        plotHeight,
        segmentGap,
      ),
    [data, barMargin.top, plotHeight, segmentGap]
  )

  const showChart = width != null && width > 0

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-4">
      <motion.h2
        className="text-center font-bold tracking-wide text-zinc-700 dark:text-zinc-50"
        style={{ fontFamily, fontSize: TITLE_FONT_SIZE }}
        initial={reduceMotion ? false : { opacity: 0, y: TITLE_ENTER_OFFSET_Y }}
        animate={
          isInView
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: TITLE_ENTER_OFFSET_Y }
        }
        transition={{
          duration: reduceMotion ? 0 : TITLE_ENTER_DURATION_S,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {t('title')}
      </motion.h2>
      <div
        dir="ltr"
        className="relative w-full overflow-visible"
        style={{ height: barHeight }}
        onPointerLeave={() => setHoveredId(null)}
      >
        {showChart ? (
          <svg
            width={chartWidth}
            height={barHeight}
            viewBox={`0 0 ${chartWidth} ${barHeight}`}
            role="img"
            aria-label={t('title')}
            style={{ overflow: 'hidden' }}
          >
            {barSegments.map((segment, index) => {
              const isHovered = hoveredId === segment.id
              const hoverGrow = isHovered ? OFFSET_WHEN_SELECTED : 0
              const activeWidth = columnWidth + hoverGrow
              const linkStartX = columnX + columnWidth
              const linkElbowX = linkStartX + linkGap
              const linkEndX = labelAnchorX
              const labelX = linkEndX + 6
              const fromBottom = barSegments.length - 1 - index
              const enterDelay = reduceMotion
                ? 0
                : fromBottom * BAR_ENTER_STAGGER_S
              const dimmed = Boolean(hoveredId && !isHovered)

              return (
                <motion.g
                  key={segment.id}
                  initial={
                    reduceMotion ? false : { opacity: 0, y: BAR_ENTER_OFFSET_Y }
                  }
                  animate={
                    isInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: BAR_ENTER_OFFSET_Y }
                  }
                  transition={{
                    delay: enterDelay,
                    duration: reduceMotion ? 0 : BAR_ENTER_DURATION_S,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onPointerEnter={() => setHoveredId(segment.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <g opacity={dimmed ? 0.55 : 1}>
                    <rect
                      x={columnX}
                      y={segment.y}
                      width={activeWidth}
                      height={Math.max(0, segment.height)}
                      rx={corner}
                      ry={corner}
                      fill={segment.color}
                    />
                    {segment.height > fontSize * 1.4 ? (
                      <text
                        x={columnX + activeWidth / 2}
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
                    <g transform={`translate(${hoverGrow} 0)`}>
                      <path
                        d={`M ${linkStartX} ${segment.midY} L ${linkElbowX} ${segment.midY} L ${linkEndX} ${segment.midY}`}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={thickness}
                        opacity={dimmed ? 0.7 : 1}
                      />
                      <text
                        x={labelX}
                        y={segment.midY}
                        dominantBaseline="central"
                        fill={labelTextColor}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={isHovered ? 700 : 400}
                      >
                        {segment.label}
                      </text>
                    </g>
                  </g>
                </motion.g>
              )
            })}
          </svg>
        ) : null}
      </div>
    </div>
  )
}
