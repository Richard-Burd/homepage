'use client'

import { motion, useInView } from 'motion/react'
import { useLocale } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  darkenHex,
  getLocaleFontFamily,

  // Arabic and Hebrew are right to left languages,
  // so we need to flip the layout of the charts and labels
  isRtlLocale,
  layoutSegments,
  useDelayedTouchSelect,
  useIsDarkMode,
  usePrefersReducedMotion,
} from './shared'
import type { DomainsChartDatum } from './types'

const TITLE_FONT_SIZE = 28.8
const HEIGHT = 420
const MARGIN = { top: 12, right: 8, bottom: 12, left: 20 }
const COLUMN_WIDTH = 40
const LABELS_FONT_SIZE = 16
const LINK_GAP = 8
const LINK_LENGTH = 14
const LEADER_ARM_THICKNESS = 2
const BAR_SEGMENT_CORNER = 3
const GAP_BETWEEN_BAR_SEGMENTS = 3
/** How far a hovered segment stretches toward the labels (mirrors pie activeOuterRadiusOffset). */
const OFFSET_WHEN_SELECTED = 12
/** Duration of hover grow / dim / label-shift on press or mouseover. */
const HOVER_DURATION_S = 0.28
const EASE = [0.22, 1, 0.36, 1] as const
/** Bottom → top entrance: travel + stagger between segments. */
const BAR_ENTER_OFFSET_Y = 40
const BAR_ENTER_DURATION_S = 0.55
const BAR_ENTER_STAGGER_S = 0.1
/** How far the title starts below its final spot before rising into place. */
const TITLE_ENTER_OFFSET_Y = 900
/** Title entrance duration in seconds — higher = slower rise/fade. */
const TITLE_ENTER_DURATION_S = 1.3
/** `true`: largest % on top. `false`: keep the data file's stacking order. */
const STACKING_ORDER = true

type Props = {
  data: DomainsChartDatum[]
  title: string
  onSelectSlice: (slice: DomainsChartDatum) => void
  /** When the detail panel closes, clear any sticky touch highlight. */
  panelOpen?: boolean
}

/** Biggest segment on top, smallest on bottom — mobile bar only. */
function stackLargestOnTop(data: DomainsChartDatum[]): DomainsChartDatum[] {
  return [...data].sort((a, b) => b.value - a.value)
}

export default function BarChartMobile({
  data,
  title,
  onSelectSlice,
  panelOpen = false,
}: Props) {
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const isRtl = isRtlLocale(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const isDark = useIsDarkMode()
  const reduceMotion = usePrefersReducedMotion()
  const { isCoarsePointer, runSelect } = useDelayedTouchSelect(
    HOVER_DURATION_S * 1000,
    reduceMotion
  )
  const hoverTransition = {
    duration: reduceMotion ? 0 : HOVER_DURATION_S,
    ease: EASE,
  }

  // Touch devices keep the highlight after finger-up so the grow animation can
  // finish; drop it when the detail panel closes (props → state sync).
  const [prevPanelOpen, setPrevPanelOpen] = useState(panelOpen)
  if (panelOpen !== prevPanelOpen) {
    setPrevPanelOpen(panelOpen)
    if (!panelOpen) setHoveredId(null)
  }

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
  // Keep SVG x=0 on the left; mirror the column to the inline-start edge for RTL.
  const columnX = isRtl
    ? chartWidth - barMargin.left - columnWidth
    : barMargin.left
  const labelAnchorX = isRtl
    ? columnX - linkGap - linkLength
    : columnX + columnWidth + linkGap + linkLength

  const barSegments = useMemo(
    () =>
      layoutSegments(
        STACKING_ORDER ? stackLargestOnTop(data) : data,
        barMargin.top,
        plotHeight,
        segmentGap
      ),
    [data, barMargin.top, plotHeight, segmentGap]
  )

  const showChart = width != null && width > 0

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-4">
      <motion.h2
        className="text-center font-bold tracking-wide text-zinc-700 dark:text-zinc-50"
        style={{ fontFamily, fontSize: TITLE_FONT_SIZE }}
        initial={
          reduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: TITLE_ENTER_OFFSET_Y }
        }
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
        {title}
      </motion.h2>
      <div
        dir="ltr"
        className="relative w-full overflow-visible"
        style={{ height: barHeight }}
        onPointerLeave={() => {
          // Touch lifts fire pointerleave; keep the highlight until the
          // delayed panel opens (or the next tap changes it).
          if (!isCoarsePointer) setHoveredId(null)
        }}
      >
        {showChart ? (
          <svg
            width={chartWidth}
            height={barHeight}
            viewBox={`0 0 ${chartWidth} ${barHeight}`}
            role="img"
            aria-label={title}
            style={{ overflow: 'hidden' }}
          >
            {barSegments.map((segment, index) => {
              const isHovered = hoveredId === segment.id
              const hoverGrow = isHovered ? OFFSET_WHEN_SELECTED : 0
              const hoverShift = isRtl ? -hoverGrow : hoverGrow
              const activeWidth = columnWidth + hoverGrow
              const barX = isRtl
                ? columnX - (isHovered ? OFFSET_WHEN_SELECTED : 0)
                : columnX
              const linkStartX = isRtl ? columnX : columnX + columnWidth
              const linkElbowX = isRtl
                ? linkStartX - linkGap
                : linkStartX + linkGap
              const linkEndX = labelAnchorX
              const labelX = isRtl ? linkEndX - 6 : linkEndX + 6
              const fromBottom = barSegments.length - 1 - index
              const enterDelay = reduceMotion
                ? 0
                : fromBottom * BAR_ENTER_STAGGER_S
              const dimmed = Boolean(hoveredId && !isHovered)

              return (
                <motion.g
                  key={segment.id}
                  initial={
                    reduceMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: BAR_ENTER_OFFSET_Y }
                  }
                  animate={
                    isInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: BAR_ENTER_OFFSET_Y }
                  }
                  transition={{
                    delay: enterDelay,
                    duration: reduceMotion ? 0 : BAR_ENTER_DURATION_S,
                    ease: EASE,
                  }}
                  onPointerEnter={() => {
                    if (!isCoarsePointer) setHoveredId(segment.id)
                  }}
                  onClick={() =>
                    runSelect(
                      () => setHoveredId(segment.id),
                      () => onSelectSlice(segment)
                    )
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <motion.g
                    initial={{ opacity: 1 }}
                    animate={{ opacity: dimmed ? 0.55 : 1 }}
                    transition={hoverTransition}
                  >
                    <motion.rect
                      y={segment.y}
                      height={Math.max(0, segment.height)}
                      rx={corner}
                      ry={corner}
                      fill={segment.color}
                      initial={{
                        x: isRtl ? columnX : columnX,
                        width: columnWidth,
                      }}
                      animate={{
                        x: barX,
                        width: activeWidth,
                      }}
                      transition={hoverTransition}
                    />
                    {segment.height > fontSize * 1.4 ? (
                      <motion.text
                        y={segment.midY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={darkenHex(segment.color)}
                        fontFamily={fontFamily}
                        fontSize={fontSize * 0.85}
                        style={{ pointerEvents: 'none' }}
                        initial={{ x: columnX + columnWidth / 2 }}
                        animate={{ x: barX + activeWidth / 2 }}
                        transition={hoverTransition}
                      >
                        {`${segment.value}%`}
                      </motion.text>
                    ) : null}
                    <motion.g
                      initial={{ x: 0 }}
                      animate={{ x: hoverShift }}
                      transition={hoverTransition}
                    >
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
                        textAnchor={isRtl ? 'end' : 'start'}
                        dominantBaseline="central"
                        fill={labelTextColor}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={isHovered ? 700 : 400}
                      >
                        {segment.label}
                      </text>
                    </motion.g>
                  </motion.g>
                </motion.g>
              )
            })}
          </svg>
        ) : null}
      </div>
    </div>
  )
}
