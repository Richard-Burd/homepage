'use client'

import { motion, useInView } from 'motion/react'
import { useLocale } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  getLocaleFontFamily,
  useIsDarkMode,
  usePrefersReducedMotion,
} from '../pie-and-bar-chart-combo/shared'

/**
 * Third-tier items are tech tools whose names are always rendered in Latin
 * script, so their labels live directly in the data file instead of the
 * translation messages (unlike tier 1 & 2 labels, which are translated).
 */
export type TechStackItem = {
  id: string
  label: string
  value: number
  color: string
}

export type TechStackGroup = {
  id: string
  label: string
  color: string
  items: TechStackItem[]
}

type Props = {
  title: string
  color: string
  groups: TechStackGroup[]
}

/** Same bar width as BarChartMobile's COLUMN_WIDTH. */
const COLUMN_WIDTH = 40
/** Horizontal space between the three tier columns. */
const TIER_GAP = 12
const MARGIN_LEFT = 8
/** Vertical pixels per unit of `value` (tier-3 values total 100). */
const PX_PER_VALUE = 8
/** Vertical gap between item bars inside one group. */
const ITEM_GAP = 6
/** Vertical room reserved above each group for its header label. */
const GROUP_HEADER_SPACE = 48
/** Extra vertical space between one group's last item and the next header. */
const GROUP_GAP = 18
/** Vertical room reserved at the top for the tier-1 title. */
const TITLE_SPACE = 44
/** How far the tier-1 bar extends below the last item bar. */
const TIER1_BOTTOM_OVERHANG = 12
const BAR_CORNER = 3
const LINK_GAP = 8
const LINK_LENGTH = 14
const LEADER_ARM_THICKNESS = 2
const ITEM_LABEL_FONT_SIZE = 16
const GROUP_LABEL_FONT_SIZE = 18
const TITLE_FONT_SIZE = 21

/** Bars start exactly one column + gap to the left, hidden behind their parent. */
const POP_OFFSET_X = COLUMN_WIDTH + TIER_GAP
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
      y += height + (index < group.items.length - 1 ? ITEM_GAP : 0)
      return layout
    })

    const barHeight = y - barTop
    cursor = y + GROUP_GAP
    return { group, headerTop, headerMidY, barTop, barHeight, items }
  })

  const contentBottom = cursor - GROUP_GAP
  const tier1Height = contentBottom + TIER1_BOTTOM_OVERHANG - tier1Top
  return {
    groupLayouts,
    tier1Top,
    tier1Height,
    totalHeight: tier1Top + tier1Height + 4,
  }
}

export default function TechStackBar({ title, color, groups }: Props) {
  const locale = useLocale()
  const localeFontFamily = getLocaleFontFamily(locale)
  const latinFontFamily = 'var(--font-roboto)'
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.1 })
  const [width, setWidth] = useState<number | null>(null)
  const isDark = useIsDarkMode()
  const reduceMotion = usePrefersReducedMotion()

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

  const showChart = width != null && width > 0

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

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const chartWidth = width ?? 320

  const tier1X = MARGIN_LEFT
  const tier2X = tier1X + COLUMN_WIDTH + TIER_GAP
  const tier3X = tier2X + COLUMN_WIDTH + TIER_GAP
  const tickStartX = tier3X + COLUMN_WIDTH + LINK_GAP
  const itemLabelX = tickStartX + LINK_LENGTH + 6

  const titleMidY = TITLE_SPACE / 2
  const titleElbowX = tier1X + 6
  const titleTextX = tier1X + 20

  return (
    <div ref={containerRef} dir="ltr" className="w-full">
      <div
        className="relative w-full overflow-visible"
        style={{ height: totalHeight }}
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
                  height:
                    GROUP_HEADER_SPACE + layout.barHeight,
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
               * and emerges as it slides right.
               */}
              {groupLayouts.map((layout) => {
                const revealed = revealedGroups.has(layout.group.id)
                return (
                  <g key={`items-${layout.group.id}`}>
                    {layout.items.map((item, index) => {
                      const barDelay = reduceMotion
                        ? 0
                        : TIER3_DELAY_S + index * TIER3_STAGGER_S
                      return (
                        <motion.g
                          key={item.id}
                          initial={
                            reduceMotion ? false : { x: -POP_OFFSET_X }
                          }
                          animate={
                            revealed ? { x: 0 } : { x: -POP_OFFSET_X }
                          }
                          transition={{
                            delay: barDelay,
                            duration: reduceMotion
                              ? 0
                              : TIER3_ENTER_DURATION_S,
                            ease: EASE,
                          }}
                        >
                          <rect
                            x={tier3X}
                            y={item.y}
                            width={COLUMN_WIDTH}
                            height={Math.max(0, item.height)}
                            rx={BAR_CORNER}
                            ry={BAR_CORNER}
                            fill={item.color}
                          />
                          <motion.g
                            initial={reduceMotion ? false : { opacity: 0 }}
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
                            <path
                              d={`M ${tickStartX} ${item.midY} L ${tickStartX + LINK_LENGTH} ${item.midY}`}
                              fill="none"
                              stroke={item.color}
                              strokeWidth={LEADER_ARM_THICKNESS}
                            />
                            <text
                              x={itemLabelX}
                              y={item.midY}
                              textAnchor="start"
                              dominantBaseline="central"
                              fill={labelTextColor}
                              fontFamily={latinFontFamily}
                              fontSize={ITEM_LABEL_FONT_SIZE}
                            >
                              {item.label}
                            </text>
                          </motion.g>
                        </motion.g>
                      )
                    })}
                  </g>
                )
              })}

              {groupLayouts.map((layout) => {
                const revealed = revealedGroups.has(layout.group.id)
                return (
                  <motion.g
                    key={`group-bar-${layout.group.id}`}
                    initial={reduceMotion ? false : { x: -POP_OFFSET_X }}
                    animate={revealed ? { x: 0 } : { x: -POP_OFFSET_X }}
                    transition={{
                      delay: reduceMotion ? 0 : TIER2_DELAY_S,
                      duration: reduceMotion ? 0 : TIER2_ENTER_DURATION_S,
                      ease: EASE,
                    }}
                  >
                    <rect
                      x={tier2X}
                      y={layout.barTop}
                      width={COLUMN_WIDTH}
                      height={Math.max(0, layout.barHeight)}
                      rx={BAR_CORNER}
                      ry={BAR_CORNER}
                      fill={layout.group.color}
                    />
                  </motion.g>
                )
              })}

              <motion.g
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, x: -TIER1_ENTER_OFFSET_X }
                }
                animate={
                  isInView
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -TIER1_ENTER_OFFSET_X }
                }
                transition={{
                  duration: reduceMotion ? 0 : TIER1_ENTER_DURATION_S,
                  ease: EASE,
                }}
              >
                <rect
                  x={tier1X}
                  y={tier1Top}
                  width={COLUMN_WIDTH}
                  height={tier1Height}
                  rx={BAR_CORNER}
                  ry={BAR_CORNER}
                  fill={color}
                />
                <path
                  d={`M ${titleElbowX} ${tier1Top} L ${titleElbowX} ${titleMidY} L ${titleTextX - 4} ${titleMidY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={LEADER_ARM_THICKNESS}
                />
                <text
                  x={titleTextX}
                  y={titleMidY}
                  textAnchor="start"
                  dominantBaseline="central"
                  fill={labelTextColor}
                  fontFamily={localeFontFamily}
                  fontSize={TITLE_FONT_SIZE}
                  fontWeight={700}
                >
                  {title}
                </text>
              </motion.g>

              {groupLayouts.map((layout) => {
                const revealed = revealedGroups.has(layout.group.id)
                const headerElbowX = tier2X + 6
                const headerTextX = tier2X + 20
                return (
                  <motion.g
                    key={`group-header-${layout.group.id}`}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={revealed ? { opacity: 1 } : { opacity: 0 }}
                    transition={{
                      delay: reduceMotion
                        ? 0
                        : TIER2_DELAY_S + TIER2_ENTER_DURATION_S * 0.5,
                      duration: reduceMotion ? 0 : LABEL_FADE_DURATION_S,
                    }}
                  >
                    <path
                      d={`M ${headerElbowX} ${layout.barTop} L ${headerElbowX} ${layout.headerMidY} L ${headerTextX - 4} ${layout.headerMidY}`}
                      fill="none"
                      stroke={layout.group.color}
                      strokeWidth={LEADER_ARM_THICKNESS}
                    />
                    <text
                      x={headerTextX}
                      y={layout.headerMidY}
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={labelTextColor}
                      fontFamily={localeFontFamily}
                      fontSize={GROUP_LABEL_FONT_SIZE}
                      fontWeight={700}
                    >
                      {layout.group.label}
                    </text>
                  </motion.g>
                )
              })}
            </svg>
          </>
        ) : null}
      </div>
    </div>
  )
}
