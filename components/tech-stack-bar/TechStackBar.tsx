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

type ItemLayout = TechStackItem & {
  y: number
  height: number
  midY: number
}

type GroupLayout = {
  group: TechStackGroup
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
    cursor = y + GROUP_GAP
    return { group, headerTop, headerMidY, barTop, barHeight, items }
  })

  const contentBottom = cursor - GROUP_GAP
  const tier1Height = contentBottom - tier1Top
  return {
    groupLayouts,
    tier1Top,
    tier1Height,
    totalHeight: tier1Top + tier1Height + 4,
  }
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
    () =>
      groups.reduce(
        (sum, group) =>
          sum + group.items.reduce((groupSum, item) => groupSum + item.value, 0),
        0
      ),
    [groups]
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

  /** Hovered bars grow toward the labels; in RTL that means growing left. */
  const grownBarX = (baseX: number, grown: boolean) =>
    grown && isRtl ? baseX - HOVER_GROW_PX : baseX
  const grownBarWidth = (grown: boolean) =>
    columnWidth + (grown ? HOVER_GROW_PX : 0)
  const dimmed = (key: string) => Boolean(hoveredKey && hoveredKey !== key)
  const hoverTransition = {
    duration: reduceMotion ? 0 : HOVER_DURATION_S,
    ease: EASE,
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
  const itemLabelX = isRtl ? tickEndX - 6 : tickEndX + 6
  const labelAnchor = isRtl ? 'end' : 'start'

  const titleMidY = TITLE_SPACE / 2
  const titleElbowX = tier1X + columnWidth / 2
  const titleTextX = isRtl ? titleElbowX - 14 : titleElbowX + 14
  const titleLeaderEndX = isRtl ? titleTextX + 4 : titleTextX - 4

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
                 * Paint order matters for the pop-out illusion: tier-3 bars are
                 * painted first (bottom), then tier-2 bars, then the tier-1 bar
                 * on top. A child bar starts exactly behind its parent column
                 * and emerges as it slides toward the open side.
                 */}
                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  return (
                    <motion.g
                      key={`items-${layout.group.id}`}
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
                        const labelShift = isHovered
                          ? HOVER_GROW_PX * growDir
                          : 0
                        return (
                          <motion.g
                            key={item.id}
                            initial={
                              reduceMotion
                                ? { opacity: 1, x: 0 }
                                : { opacity: 0, x: popOffsetX }
                            }
                            animate={
                              revealed
                                ? { opacity: 1, x: 0 }
                                : { opacity: 0, x: popOffsetX }
                            }
                            transition={{
                              delay: barDelay,
                              duration: reduceMotion
                                ? 0
                                : TIER3_ENTER_DURATION_S,
                              ease: EASE,
                            }}
                            onPointerEnter={() => {
                              if (!isCoarsePointer) setHoveredKey(hoverKey)
                            }}
                            onPointerLeave={() => {
                              if (!isCoarsePointer) setHoveredKey(null)
                            }}
                            onClick={() =>
                              runSelect(
                                () => setHoveredKey(hoverKey),
                                () =>
                                  setSelectedSlice({
                                    id: item.id,
                                    label: item.label,
                                    description: item.description,
                                    value: item.value,
                                    color: item.color,
                                  })
                              )
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            <motion.g
                              initial={{ opacity: 1 }}
                              animate={{
                                opacity: dimmed(hoverKey)
                                  ? DIMMED_OPACITY
                                  : 1,
                              }}
                              transition={hoverTransition}
                            >
                              <motion.rect
                                y={item.y}
                                height={Math.max(0, item.height)}
                                rx={BAR_CORNER}
                                ry={BAR_CORNER}
                                fill={item.color}
                                initial={{
                                  x: tier3X,
                                  width: columnWidth,
                                }}
                                animate={{
                                  x: grownBarX(tier3X, isHovered),
                                  width: grownBarWidth(isHovered),
                                }}
                                transition={hoverTransition}
                              />
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
                                  animate={{ x: labelShift }}
                                  transition={hoverTransition}
                                >
                                  <path
                                    d={`M ${tickStartX} ${item.midY} L ${tickEndX} ${item.midY}`}
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth={LEADER_ARM_THICKNESS}
                                  />
                                  <text
                                    x={itemLabelX}
                                    y={item.midY}
                                    textAnchor={labelAnchor}
                                    dominantBaseline="central"
                                    fill={labelTextColor}
                                    fontFamily={latinFontFamily}
                                    fontSize={itemLabelFontSize}
                                    fontWeight={isHovered ? 700 : 400}
                                  >
                                    {item.label}
                                  </text>
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
                  const isHovered = hoveredKey === hoverKey
                  const groupValue = layout.items.reduce(
                    (sum, item) => sum + item.value,
                    0
                  )
                  return (
                    <motion.g
                      key={`group-bar-${layout.group.id}`}
                      initial={{ x: 0 }}
                      animate={{ x: tier1Shift }}
                      transition={hoverTransition}
                    >
                      <motion.g
                        initial={
                          reduceMotion
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: popOffsetX }
                        }
                        animate={
                          revealed
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: popOffsetX }
                        }
                        transition={{
                          delay: reduceMotion ? 0 : TIER2_DELAY_S,
                          duration: reduceMotion ? 0 : TIER2_ENTER_DURATION_S,
                          ease: EASE,
                        }}
                        onPointerEnter={() => {
                          if (!isCoarsePointer) setHoveredKey(hoverKey)
                        }}
                        onPointerLeave={() => {
                          if (!isCoarsePointer) setHoveredKey(null)
                        }}
                        onClick={() =>
                          runSelect(
                            () => setHoveredKey(hoverKey),
                            () =>
                              setSelectedSlice({
                                id: layout.group.id,
                                label: layout.group.label,
                                description: layout.group.description,
                                value: groupValue,
                                color: layout.group.color,
                              })
                          )
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <motion.rect
                          y={layout.barTop}
                          height={Math.max(0, layout.barHeight)}
                          rx={BAR_CORNER}
                          ry={BAR_CORNER}
                          fill={layout.group.color}
                          initial={{
                            x: tier2X,
                            width: columnWidth,
                            opacity: 1,
                          }}
                          animate={{
                            x: grownBarX(tier2X, isHovered),
                            width: grownBarWidth(isHovered),
                            opacity: dimmed(hoverKey) ? DIMMED_OPACITY : 1,
                          }}
                          transition={hoverTransition}
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
                  onPointerEnter={() => {
                    if (!isCoarsePointer) setHoveredKey(ROOT_HOVER_KEY)
                  }}
                  onPointerLeave={() => {
                    if (!isCoarsePointer) setHoveredKey(null)
                  }}
                  onClick={() =>
                    runSelect(
                      () => setHoveredKey(ROOT_HOVER_KEY),
                      () =>
                        setSelectedSlice({
                          id: ROOT_HOVER_KEY,
                          label: title,
                          description,
                          value: totalValue,
                          color,
                        })
                    )
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <motion.g
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: dimmed(ROOT_HOVER_KEY) ? DIMMED_OPACITY : 1,
                    }}
                    transition={hoverTransition}
                  >
                    <motion.rect
                      y={tier1Top}
                      height={tier1Height}
                      rx={BAR_CORNER}
                      ry={BAR_CORNER}
                      fill={color}
                      initial={{
                        x: tier1X,
                        width: columnWidth,
                      }}
                      animate={{
                        x: grownBarX(tier1X, isRootHovered),
                        width: grownBarWidth(isRootHovered),
                      }}
                      transition={hoverTransition}
                    />
                    <path
                      d={`M ${titleElbowX} ${tier1Top} L ${titleElbowX} ${titleMidY} L ${titleLeaderEndX} ${titleMidY}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={LEADER_ARM_THICKNESS}
                    />
                    <text
                      x={titleTextX}
                      y={titleMidY}
                      textAnchor={labelAnchor}
                      dominantBaseline="central"
                      fill={labelTextColor}
                      fontFamily={localeFontFamily}
                      fontSize={titleFontSize}
                      fontWeight={700}
                    >
                      {title}
                    </text>
                  </motion.g>
                </motion.g>

                {groupLayouts.map((layout) => {
                  const revealed = revealedGroups.has(layout.group.id)
                  const hoverKey = groupHoverKey(layout.group.id)
                  const headerElbowX = tier2X + columnWidth / 2
                  const headerTextX = isRtl
                    ? headerElbowX - 14
                    : headerElbowX + 14
                  const headerLeaderEndX = isRtl
                    ? headerTextX + 4
                    : headerTextX - 4
                  return (
                    <motion.g
                      key={`group-header-${layout.group.id}`}
                      initial={
                        reduceMotion ? { opacity: 1 } : { opacity: 0 }
                      }
                      animate={revealed ? { opacity: 1 } : { opacity: 0 }}
                      transition={{
                        delay: reduceMotion
                          ? 0
                          : TIER2_DELAY_S + TIER2_ENTER_DURATION_S * 0.5,
                        duration: reduceMotion ? 0 : LABEL_FADE_DURATION_S,
                      }}
                    >
                      <motion.g
                        initial={{ x: 0, opacity: 1 }}
                        animate={{
                          x: tier1Shift,
                          opacity: dimmed(hoverKey) ? DIMMED_OPACITY : 1,
                        }}
                        transition={hoverTransition}
                      >
                        <path
                          d={`M ${headerElbowX} ${layout.barTop} L ${headerElbowX} ${layout.headerMidY} L ${headerLeaderEndX} ${layout.headerMidY}`}
                          fill="none"
                          stroke={layout.group.color}
                          strokeWidth={LEADER_ARM_THICKNESS}
                        />
                        <text
                          x={headerTextX}
                          y={layout.headerMidY}
                          textAnchor={labelAnchor}
                          dominantBaseline="central"
                          fill={labelTextColor}
                          fontFamily={localeFontFamily}
                          fontSize={groupLabelFontSize}
                          fontWeight={700}
                        >
                          {layout.group.label}
                        </text>
                      </motion.g>
                    </motion.g>
                  )
                })}
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
        desktopPlacement="side"
      />
    </div>
  )
}
