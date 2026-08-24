'use client'

import { motion, useInView } from 'motion/react'
import { useLocale } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import SliceDetailPanel from '../pie-and-bar-chart-combo/SliceDetailPanel'
import {
  getLocaleFontFamily,
  isRtlLocale,
  useDelayedTouchSelect,
  useIsDarkMode,
  usePrefersReducedMotion,
} from '../pie-and-bar-chart-combo/shared'
import type { DomainsChartDatum } from '../pie-and-bar-chart-combo/types'

/**
 * Third-tier items are tech tools whose names are always rendered in Latin
 * script, so their labels live directly in the data file instead of the
 * translation messages (unlike tier 1 & 2 labels, which are translated).
 * Descriptions for all tiers are translated and shown in the detail panel.
 */
export type TechStackItem = {
  id: string
  label: string
  description: string
  value: number
  color: string
}

export type TechStackGroup = {
  id: string
  label: string
  description: string
  color: string
  items: TechStackItem[]
}

type Props = {
  title: string
  description: string
  color: string
  groups: TechStackGroup[]
}

/** Matches PieAndBarCharts' narrow/wide split. */
const WIDE_VIEWPORT_PX = 800
/** Base bar width (narrow viewports). */
const COLUMN_WIDTH_NARROW = 28
const COLUMN_WIDTH_WIDE = COLUMN_WIDTH_NARROW * 2
const MARGIN_LEFT = 8
/** Vertical pixels per unit of `value` (tier-3 values total 100). */
const PX_PER_VALUE = 8
/**
 * Shared gap used for both the vertical space between stacked tier-3 bars
 * and the horizontal space between the three tier columns — keeps x/y rhythm equal.
 */
const SEGMENT_GAP = 6
/** Vertical room reserved above each group for its header label. */
const GROUP_HEADER_SPACE = 48
/** Extra vertical space between one group's last item and the next header. */
const GROUP_GAP = 18
/** Vertical room reserved at the top for the tier-1 title. */
const TITLE_SPACE = 44
const BAR_CORNER = 3
const LINK_LENGTH = 14
const LEADER_ARM_THICKNESS = 2
const ITEM_LABEL_FONT_SIZE = 16
const GROUP_LABEL_FONT_SIZE = 18
/** Tier-1 title matches tier-2 group labels. */
const TITLE_FONT_SIZE = GROUP_LABEL_FONT_SIZE
/** Font scale at wide viewports (800px+). */
const WIDE_FONT_SCALE = 1.2
/** How far a hovered bar grows toward the labels (mirrors BarChartMobile). */
const HOVER_GROW_PX = 12
/** Duration of hover grow / shift / dim animations. */
const HOVER_DURATION_S = 0.28
/** Opacity of non-hovered bars while one bar is hovered. */
const DIMMED_OPACITY = 0.55
const ELBOW_TEXT_OFFSET = 14
const TICK_TEXT_GAP = 6

const TIER1_ENTER_OFFSET_X = 80
const TIER1_ENTER_DURATION_S = 0.7
/** Tier-2 waits for tier-1 to (mostly) arrive before popping out of it. */
const TIER2_DELAY_S = 0.5
const TIER2_ENTER_DURATION_S = 0.55
/** Tier-3 pops out of tier 2 right after tier 2 lands. */
const TIER3_DELAY_S = 0.95
const TIER3_STAGGER_S = 0.06
const TIER3_ENTER_DURATION_S = 0.5
const LABEL_FADE_DURATION_S = 0.35
/** Fraction of a group's sentinel that must be visible to trigger its reveal. */
const REVEAL_THRESHOLD = 0.3
const EASE = [0.22, 1, 0.36, 1] as const

const ROOT_HOVER_KEY = 'root'

type HoverTransition = { duration: number; ease: typeof EASE }

type ItemLayout = TechStackItem & {
  y: number
  height: number
  midY: number
}

type GroupLayout = {
  group: TechStackGroup
  groupValue: number
  headerTop: number
  headerMidY: number
  barTop: number
  barHeight: number
  items: ItemLayout[]
}

function layoutGroups(groups: TechStackGroup[]): {
  groupLayouts: GroupLayout[]
  tier1Top: number
  tier1Height: number
  totalHeight: number
} {
  const tier1Top = TITLE_SPACE
  let cursor = tier1Top

  const groupLayouts = groups.map((group) => {
    const headerTop = cursor
    const headerMidY = cursor + GROUP_HEADER_SPACE / 2
    const barTop = cursor + GROUP_HEADER_SPACE
    let y = barTop

    const items = group.items.map((item, index) => {
      const height = item.value * PX_PER_VALUE
      const layout: ItemLayout = { ...item, y, height, midY: y + height / 2 }
      y += height + (index < group.items.length - 1 ? SEGMENT_GAP : 0)
      return layout
    })

    const barHeight = y - barTop
    const groupValue = items.reduce((sum, item) => sum + item.value, 0)
    cursor = y + GROUP_GAP
    return {
      group,
      groupValue,
      headerTop,
      headerMidY,
      barTop,
      barHeight,
      items,
    }
  })

  const contentBottom = cursor - GROUP_GAP
  /**
   * Align the root bar with the first group's bars (and tier-3 items) instead
   * of extending through the first header band. The title still lives in
   * TITLE_SPACE above; its elbow just stems from this lower top.
   */
  const alignedTier1Top = groupLayouts[0]?.barTop ?? TITLE_SPACE
  const tier1Height = Math.max(0, contentBottom - alignedTier1Top)
  return {
    groupLayouts,
    tier1Top: alignedTier1Top,
    tier1Height,
    totalHeight: contentBottom + 4,
  }
}

function sliceOf(
  id: string,
  label: string,
  description: string,
  value: number,
  color: string
): DomainsChartDatum {
  return { id, label, description, value, color }
}

function elbowGeometry(columnX: number, columnWidth: number, isRtl: boolean) {
  const elbowX = columnX + columnWidth / 2
  const textX = isRtl ? elbowX - ELBOW_TEXT_OFFSET : elbowX + ELBOW_TEXT_OFFSET
  const leaderEndX = isRtl ? textX + 4 : textX - 4
  return { elbowX, textX, leaderEndX }
}

function GrownBar({
  y,
  height,
  fill,
  baseX,
  grown,
  columnWidth,
  isRtl,
  hoverTransition,
  opacity,
}: {
  y: number
  height: number
  fill: string
  baseX: number
  grown: boolean
  columnWidth: number
  isRtl: boolean
  hoverTransition: HoverTransition
  opacity?: number
}) {
  const x = grown && isRtl ? baseX - HOVER_GROW_PX : baseX
  const width = columnWidth + (grown ? HOVER_GROW_PX : 0)
  const initial = {
    x: baseX,
    width: columnWidth,
    ...(opacity != null ? { opacity: 1 } : {}),
  }
  const animate = {
    x,
    width,
    ...(opacity != null ? { opacity } : {}),
  }
  return (
    <motion.rect
      y={y}
      height={Math.max(0, height)}
      rx={BAR_CORNER}
      ry={BAR_CORNER}
      fill={fill}
      initial={initial}
      animate={animate}
      transition={hoverTransition}
    />
  )
}

function TickLeaderLabel({
  tickStartX,
  tickEndX,
  midY,
  textX,
  textAnchor,
  color,
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  label,
}: {
  tickStartX: number
  tickEndX: number
  midY: number
  textX: number
  textAnchor: 'start' | 'end'
  color: string
  fill: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  label: string
}) {
  return (
    <>
      <path
        d={`M ${tickStartX} ${midY} L ${tickEndX} ${midY}`}
        fill="none"
        stroke={color}
        strokeWidth={LEADER_ARM_THICKNESS}
      />
      <text
        x={textX}
        y={midY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fill={fill}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fontWeight={fontWeight}
      >
        {label}
      </text>
    </>
  )
}

function ElbowLeaderLabel({
  elbowX,
  fromY,
  midY,
  leaderEndX,
  textX,
  textAnchor,
  color,
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  label,
}: {
  elbowX: number
  fromY: number
  midY: number
  leaderEndX: number
  textX: number
  textAnchor: 'start' | 'end'
  color: string
  fill: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  label: string
}) {
  return (
    <>
      <path
        d={`M ${elbowX} ${fromY} L ${elbowX} ${midY} L ${leaderEndX} ${midY}`}
        fill="none"
        stroke={color}
        strokeWidth={LEADER_ARM_THICKNESS}
      />
      <text
        x={textX}
        y={midY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fill={fill}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fontWeight={fontWeight}
      >
        {label}
      </text>
    </>
  )
}

export default function TechStackBar({
  title,
  description,
  color,
  groups,
}: Props) {
  const locale = useLocale()
  const isRtl = isRtlLocale(locale)
  const localeFontFamily = getLocaleFontFamily(locale)
  const latinFontFamily = 'var(--font-roboto)'
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.1 })
  const [width, setWidth] = useState<number | null>(null)
  const [isWideViewport, setIsWideViewport] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [selectedSlice, setSelectedSlice] = useState<DomainsChartDatum | null>(
    null
  )
  const isDark = useIsDarkMode()
  const reduceMotion = usePrefersReducedMotion()
  const { isCoarsePointer, runSelect } = useDelayedTouchSelect(
    HOVER_DURATION_S * 1000,
    reduceMotion
  )

  const [revealedGroups, setRevealedGroups] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const sentinelRefs = useRef(new Map<string, HTMLDivElement>())

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
    const media = window.matchMedia(`(min-width: ${WIDE_VIEWPORT_PX}px)`)

    function syncViewport() {
      setIsWideViewport(media.matches)
    }

    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  const showChart = width != null && width > 0

  const columnWidth = isWideViewport ? COLUMN_WIDTH_WIDE : COLUMN_WIDTH_NARROW
  const fontScale = isWideViewport ? WIDE_FONT_SCALE : 1
  const itemLabelFontSize = ITEM_LABEL_FONT_SIZE * fontScale
  const groupLabelFontSize = GROUP_LABEL_FONT_SIZE * fontScale
  const titleFontSize = TITLE_FONT_SIZE * fontScale
  /**
   * Bars start exactly one column + gap behind their parent, then pop out
   * toward the open side (right in LTR, left in RTL).
   */
  const popOffsetX = isRtl
    ? columnWidth + SEGMENT_GAP
    : -(columnWidth + SEGMENT_GAP)
  const tier1EnterOffsetX = isRtl ? TIER1_ENTER_OFFSET_X : -TIER1_ENTER_OFFSET_X

  // Each group only animates in once its own sentinel scrolls into view.
  useEffect(() => {
    if (!showChart) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = (entry.target as HTMLElement).dataset.groupId
          if (!id) continue
          observer.unobserve(entry.target)
          setRevealedGroups((previous) =>
            previous.has(id) ? previous : new Set(previous).add(id)
          )
        }
      },
      { threshold: REVEAL_THRESHOLD }
    )
    for (const element of sentinelRefs.current.values()) {
      observer.observe(element)
    }
    return () => observer.disconnect()
  }, [showChart, groups])

  const { groupLayouts, tier1Top, tier1Height, totalHeight } = useMemo(
    () => layoutGroups(groups),
    [groups]
  )

  const totalValue = useMemo(
    () => groupLayouts.reduce((sum, layout) => sum + layout.groupValue, 0),
    [groupLayouts]
  )

  const rootSlice = useMemo(
    () => sliceOf(ROOT_HOVER_KEY, title, description, totalValue, color),
    [title, description, totalValue, color]
  )

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const chartWidth = width ?? 320
  const sideMargin = MARGIN_LEFT

  /** Toward-the-labels direction: +x in LTR, -x in RTL. */
  const growDir = isRtl ? -1 : 1
  const isRootHovered = hoveredKey === ROOT_HOVER_KEY
  /** When tier 1 grows, tiers 2 & 3 (and all labels) shift to keep the gaps. */
  const tier1Shift = isRootHovered ? HOVER_GROW_PX * growDir : 0

  const groupHoverKey = (groupId: string) => `group:${groupId}`
  const itemHoverKey = (itemId: string) => `item:${itemId}`
  /** When a tier-2 bar grows, its own tier-3 children shift to keep the gap. */
  const groupShift = (groupId: string) =>
    hoveredKey === groupHoverKey(groupId) ? HOVER_GROW_PX * growDir : 0

  const dimmed = (key: string) => Boolean(hoveredKey && hoveredKey !== key)
  const hoverTransition: HoverTransition = {
    duration: reduceMotion ? 0 : HOVER_DURATION_S,
    ease: EASE,
  }

  function segmentPointer(hoverKey: string, slice: DomainsChartDatum) {
    return {
      onPointerEnter: () => {
        if (!isCoarsePointer) setHoveredKey(hoverKey)
      },
      onPointerLeave: () => {
        if (!isCoarsePointer) setHoveredKey(null)
      },
      onClick: () =>
        runSelect(
          () => setHoveredKey(hoverKey),
          () => setSelectedSlice(slice)
        ),
      style: { cursor: 'pointer' as const },
    }
  }

  // Keep SVG x=0 on the left; mirror the columns to the inline-start edge for RTL.
  const tier1X = isRtl ? chartWidth - sideMargin - columnWidth : sideMargin
  const tier2X = isRtl
    ? tier1X - SEGMENT_GAP - columnWidth
    : tier1X + columnWidth + SEGMENT_GAP
  const tier3X = isRtl
    ? tier2X - SEGMENT_GAP - columnWidth
    : tier2X + columnWidth + SEGMENT_GAP
  const tickStartX = isRtl ? tier3X : tier3X + columnWidth
  const tickEndX = isRtl ? tickStartX - LINK_LENGTH : tickStartX + LINK_LENGTH
  const itemLabelX = isRtl ? tickEndX - TICK_TEXT_GAP : tickEndX + TICK_TEXT_GAP
  const labelAnchor = isRtl ? 'end' : 'start'

  const titleMidY = TITLE_SPACE / 2
  const titleElbow = elbowGeometry(tier1X, columnWidth, isRtl)

  const popEnter = (revealed: boolean) =>
    revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: popOffsetX }
  const popInitial = reduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: 0, x: popOffsetX }

  const barRect = {
    columnWidth,
    isRtl,
    hoverTransition,
  }

  return (
    <div className="w-full">
      {/* dir=ltr keeps SVG math in one coordinate system; RTL is mirrored
          via the tier X positions above. The detail panel lives outside this
          wrapper so it follows the page's real direction. */}
      <div ref={containerRef} dir="ltr" className="w-full">
        <div
          className="relative w-full overflow-visible"
          style={{ height: totalHeight }}
          onPointerLeave={() => {
            // Touch lifts fire pointerleave; keep the highlight until the
            // delayed panel opens (or the next tap changes it).
            if (!isCoarsePointer) setHoveredKey(null)
          }}
        >
          {showChart ? (
            <>
              {groupLayouts.map((layout) => (
                <div
                  key={layout.group.id}
                  aria-hidden
                  data-group-id={layout.group.id}
                  ref={(element) => {
                    if (element) {
                      sentinelRefs.current.set(layout.group.id, element)
                    } else {
                      sentinelRefs.current.delete(layout.group.id)
                    }
                  }}
                  className="pointer-events-none absolute inset-x-0"
                  style={{
                    top: layout.headerTop,
                    height: GROUP_HEADER_SPACE + layout.barHeight,
                  }}
                />
              ))}
              <svg
                width={chartWidth}
                height={totalHeight}
                viewBox={`0 0 ${chartWidth} ${totalHeight}`}
                role="img"
                aria-label={title}
                style={{ overflow: 'hidden' }}
              >
                {/*
                 * Paint order: all bars back-to-front (tier 3, 2, 1), then all
                 * labels. Data hierarchy is root → group → item; SVG order is
                 * a layering concern so children can pop out from behind parents.
                 * Each selectable segment applies the same pointer handlers to
                 * both its bar and its label.
                 */}
                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  return (
                    <motion.g
                      key={`item-bars-${layout.group.id}`}
                      initial={{ x: 0 }}
                      animate={{
                        x: tier1Shift + groupShift(layout.group.id),
                      }}
                      transition={hoverTransition}
                    >
                      {layout.items.map((item, index) => {
                        const hoverKey = itemHoverKey(item.id)
                        const slice = sliceOf(
                          item.id,
                          item.label,
                          item.description,
                          item.value,
                          item.color
                        )
                        return (
                          <motion.g
                            key={item.id}
                            initial={popInitial}
                            animate={popEnter(revealed)}
                            transition={{
                              delay: reduceMotion
                                ? 0
                                : TIER3_DELAY_S + index * TIER3_STAGGER_S,
                              duration: reduceMotion
                                ? 0
                                : TIER3_ENTER_DURATION_S,
                              ease: EASE,
                            }}
                            {...segmentPointer(hoverKey, slice)}
                          >
                            <motion.g
                              initial={{ opacity: 1 }}
                              animate={{
                                opacity: dimmed(hoverKey) ? DIMMED_OPACITY : 1,
                              }}
                              transition={hoverTransition}
                            >
                              <GrownBar
                                y={item.y}
                                height={item.height}
                                fill={item.color}
                                baseX={tier3X}
                                grown={hoveredKey === hoverKey}
                                {...barRect}
                              />
                            </motion.g>
                          </motion.g>
                        )
                      })}
                    </motion.g>
                  )
                })}

                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  const hoverKey = groupHoverKey(layout.group.id)
                  const slice = sliceOf(
                    layout.group.id,
                    layout.group.label,
                    layout.group.description,
                    layout.groupValue,
                    layout.group.color
                  )
                  return (
                    <motion.g
                      key={`group-bar-${layout.group.id}`}
                      initial={{ x: 0 }}
                      animate={{ x: tier1Shift }}
                      transition={hoverTransition}
                    >
                      <motion.g
                        initial={popInitial}
                        animate={popEnter(revealed)}
                        transition={{
                          delay: reduceMotion ? 0 : TIER2_DELAY_S,
                          duration: reduceMotion ? 0 : TIER2_ENTER_DURATION_S,
                          ease: EASE,
                        }}
                        {...segmentPointer(hoverKey, slice)}
                      >
                        <GrownBar
                          y={layout.barTop}
                          height={layout.barHeight}
                          fill={layout.group.color}
                          baseX={tier2X}
                          grown={hoveredKey === hoverKey}
                          opacity={dimmed(hoverKey) ? DIMMED_OPACITY : 1}
                          {...barRect}
                        />
                      </motion.g>
                    </motion.g>
                  )
                })}

                <motion.g
                  initial={
                    reduceMotion
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: tier1EnterOffsetX }
                  }
                  animate={
                    isInView
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: tier1EnterOffsetX }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : TIER1_ENTER_DURATION_S,
                    ease: EASE,
                  }}
                  {...segmentPointer(ROOT_HOVER_KEY, rootSlice)}
                >
                  <motion.g
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: dimmed(ROOT_HOVER_KEY) ? DIMMED_OPACITY : 1,
                    }}
                    transition={hoverTransition}
                  >
                    <GrownBar
                      y={tier1Top}
                      height={tier1Height}
                      fill={color}
                      baseX={tier1X}
                      grown={isRootHovered}
                      {...barRect}
                    />
                  </motion.g>
                </motion.g>

                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  return (
                    <motion.g
                      key={`item-labels-${layout.group.id}`}
                      initial={{ x: 0 }}
                      animate={{
                        x: tier1Shift + groupShift(layout.group.id),
                      }}
                      transition={hoverTransition}
                    >
                      {layout.items.map((item, index) => {
                        const barDelay = reduceMotion
                          ? 0
                          : TIER3_DELAY_S + index * TIER3_STAGGER_S
                        const hoverKey = itemHoverKey(item.id)
                        const isHovered = hoveredKey === hoverKey
                        const slice = sliceOf(
                          item.id,
                          item.label,
                          item.description,
                          item.value,
                          item.color
                        )
                        return (
                          <motion.g
                            key={item.id}
                            initial={popInitial}
                            animate={popEnter(revealed)}
                            transition={{
                              delay: barDelay,
                              duration: reduceMotion
                                ? 0
                                : TIER3_ENTER_DURATION_S,
                              ease: EASE,
                            }}
                            {...segmentPointer(hoverKey, slice)}
                          >
                            <motion.g
                              initial={{ opacity: 1 }}
                              animate={{
                                opacity: dimmed(hoverKey) ? DIMMED_OPACITY : 1,
                              }}
                              transition={hoverTransition}
                            >
                              <motion.g
                                initial={
                                  reduceMotion
                                    ? { opacity: 1 }
                                    : { opacity: 0 }
                                }
                                animate={
                                  revealed ? { opacity: 1 } : { opacity: 0 }
                                }
                                transition={{
                                  delay: reduceMotion
                                    ? 0
                                    : barDelay + TIER3_ENTER_DURATION_S * 0.5,
                                  duration: reduceMotion
                                    ? 0
                                    : LABEL_FADE_DURATION_S,
                                }}
                              >
                                <motion.g
                                  initial={{ x: 0 }}
                                  animate={{
                                    x: isHovered ? HOVER_GROW_PX * growDir : 0,
                                  }}
                                  transition={hoverTransition}
                                >
                                  <TickLeaderLabel
                                    tickStartX={tickStartX}
                                    tickEndX={tickEndX}
                                    midY={item.midY}
                                    textX={itemLabelX}
                                    textAnchor={labelAnchor}
                                    color={item.color}
                                    fill={labelTextColor}
                                    fontFamily={latinFontFamily}
                                    fontSize={itemLabelFontSize}
                                    fontWeight={isHovered ? 700 : 400}
                                    label={item.label}
                                  />
                                </motion.g>
                              </motion.g>
                            </motion.g>
                          </motion.g>
                        )
                      })}
                    </motion.g>
                  )
                })}

                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  const hoverKey = groupHoverKey(layout.group.id)
                  const slice = sliceOf(
                    layout.group.id,
                    layout.group.label,
                    layout.group.description,
                    layout.groupValue,
                    layout.group.color
                  )
                  const header = elbowGeometry(tier2X, columnWidth, isRtl)
                  return (
                    <motion.g
                      key={`group-label-${layout.group.id}`}
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      animate={revealed ? { opacity: 1 } : { opacity: 0 }}
                      transition={{
                        delay: reduceMotion
                          ? 0
                          : TIER2_DELAY_S + TIER2_ENTER_DURATION_S * 0.5,
                        duration: reduceMotion ? 0 : LABEL_FADE_DURATION_S,
                      }}
                      {...segmentPointer(hoverKey, slice)}
                    >
                      <motion.g
                        initial={{ x: 0, opacity: 1 }}
                        animate={{
                          x: tier1Shift,
                          opacity: dimmed(hoverKey) ? DIMMED_OPACITY : 1,
                        }}
                        transition={hoverTransition}
                      >
                        <ElbowLeaderLabel
                          elbowX={header.elbowX}
                          fromY={layout.barTop}
                          midY={layout.headerMidY}
                          leaderEndX={header.leaderEndX}
                          textX={header.textX}
                          textAnchor={labelAnchor}
                          color={layout.group.color}
                          fill={labelTextColor}
                          fontFamily={localeFontFamily}
                          fontSize={groupLabelFontSize}
                          fontWeight={700}
                          label={layout.group.label}
                        />
                      </motion.g>
                    </motion.g>
                  )
                })}

                <motion.g
                  initial={
                    reduceMotion
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: tier1EnterOffsetX }
                  }
                  animate={
                    isInView
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: tier1EnterOffsetX }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : TIER1_ENTER_DURATION_S,
                    ease: EASE,
                  }}
                  {...segmentPointer(ROOT_HOVER_KEY, rootSlice)}
                >
                  <motion.g
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: dimmed(ROOT_HOVER_KEY) ? DIMMED_OPACITY : 1,
                    }}
                    transition={hoverTransition}
                  >
                    <ElbowLeaderLabel
                      elbowX={titleElbow.elbowX}
                      fromY={tier1Top}
                      midY={titleMidY}
                      leaderEndX={titleElbow.leaderEndX}
                      textX={titleElbow.textX}
                      textAnchor={labelAnchor}
                      color={color}
                      fill={labelTextColor}
                      fontFamily={localeFontFamily}
                      fontSize={titleFontSize}
                      fontWeight={700}
                      label={title}
                    />
                  </motion.g>
                </motion.g>
              </svg>
            </>
          ) : null}
        </div>
      </div>
      <SliceDetailPanel
        slice={selectedSlice}
        onClose={() => {
          setSelectedSlice(null)
          setHoveredKey(null)
        }}
        desktopPlacement="anchor"
        anchorRef={containerRef}
      />
    </div>
  )
}
