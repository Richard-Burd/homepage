'use client'

import { ResponsivePie } from '@nivo/pie'
import { motion, useInView } from 'motion/react'
import { useLocale } from 'next-intl'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

import {
  getLocaleFontFamily,
  useIsDarkMode,
  usePrefersReducedMotion,
} from './shared'
import type { DomainsChartDatum } from './types'

const TITLE_FONT_SIZE = 40
/** How far left of its final spot the title starts before sliding in. */
const TITLE_ENTER_OFFSET_X = -80
const TITLE_ENTER_DURATION_S = 1.3
/** Baseline chart size used for proportional scaling. */
const BASE_WIDTH = 688 // 43rem
const BASE_HEIGHT = 380 // ~23.75rem
const DESIGN_MARGIN = { top: 40, right: 200, bottom: 40, left: 140 }
const LABELS_FONT_SIZE = 19
const LEADER_ARM_DIAGONAL_SEGMENT = 16
const LEADER_ARM_STRAIGHT_SEGMENT = 20
const LEADER_ARM_THICKNESS = 2
const OFFSET_WHEN_SELECTED = 8
const DEFAULT_INNER_RADIUS = 0.5
const SLICE_STAGGER_MS = 180

type Props = {
  data: DomainsChartDatum[]
  title: string
  onSelectSlice: (slice: DomainsChartDatum) => void
}

export default memo(function PieChartDesktop({
  data,
  title,
  onSelectSlice,
}: Props) {
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)
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

  useEffect(() => {
    if (!isInView || data.length === 0) return

    let cancelled = false
    let timeoutId = 0
    const total = data.length

    if (reduceMotion) {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) setVisibleCount(total)
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
      if (revealed < total) {
        timeoutId = window.setTimeout(revealNext, SLICE_STAGGER_MS)
      }
    }

    timeoutId = window.setTimeout(revealNext, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
    // `data` is memoized by the parent; identity only changes when slice content does.
  }, [isInView, data, reduceMotion])

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'

  const visibleData = useMemo(
    () => (visibleCount > 0 ? data.slice(data.length - visibleCount) : []),
    [data, visibleCount]
  )

  const pieScale = width == null ? 1 : Math.min(1, width / BASE_WIDTH)
  const pieHeight = BASE_HEIGHT * pieScale
  const showChart = width != null && width > 0 && visibleData.length > 0

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-4">
      <motion.h2
        className="text-center font-bold tracking-wide text-zinc-700 dark:text-zinc-50"
        style={{ fontFamily, fontSize: TITLE_FONT_SIZE }}
        initial={reduceMotion ? false : { opacity: 0, x: TITLE_ENTER_OFFSET_X }}
        animate={
          isInView
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: TITLE_ENTER_OFFSET_X }
        }
        transition={{
          duration: reduceMotion ? 0 : TITLE_ENTER_DURATION_S,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {title}
      </motion.h2>
      {/*
        Nivo fades entering arcs/labels with the same spring that grows them
        from zero width, so the fade is imperceptible (and the first slice
        skips the enter phase entirely). A one-run CSS animation on each SVG
        element overrides the spring-driven opacity attribute while it plays,
        making every slice and label visibly fade in as it moves into place.
      */}
      <div
        dir="ltr"
        className={`relative w-full overflow-visible [&_svg]:overflow-visible [&_text]:cursor-pointer [&>div]:overflow-visible ${
          reduceMotion
            ? ''
            : '[&_path]:animate-pie-fade-in [&_text]:animate-pie-fade-in'
        }`}
        style={{ height: pieHeight }}
        onClick={(event) => {
          const target = event.target
          if (!(target instanceof SVGTextElement)) return
          const text = target.textContent?.trim()
          // Skip in-slice percentage labels like "30%".
          if (!text || /^\d+%$/.test(text)) return
          const slice = data.find((datum) => datum.label === text)
          if (slice) onSelectSlice(slice)
        }}
      >
        {showChart ? (
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
            activeOuterRadiusOffset={OFFSET_WHEN_SELECTED * pieScale}
            colors={{ datum: 'data.color' }}
            valueFormat={(value) => `${value}%`}
            animate
            motionConfig="gentle"
            transitionMode="startAngle"
            tooltip={() => null}
            onClick={(datum) => {
              onSelectSlice(datum.data)
            }}
            theme={{
              labels: {
                text: {
                  fontSize: Math.max(1, LABELS_FONT_SIZE * pieScale),
                  fontFamily,
                  fill: labelTextColor,
                },
              },
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabel={(datum) => String(datum.label)}
            arcLinkLabelsTextColor={labelTextColor}
            arcLinkLabelsThickness={Math.max(
              1,
              LEADER_ARM_THICKNESS * pieScale
            )}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLinkLabelsDiagonalLength={LEADER_ARM_DIAGONAL_SEGMENT * pieScale}
            arcLinkLabelsStraightLength={LEADER_ARM_STRAIGHT_SEGMENT * pieScale}
            enableArcLabels
            arcLabelsSkipAngle={10}
            arcLabel={(datum) => `${datum.value}%`}
            arcLabelsTextColor={{
              from: 'color',
              modifiers: [['darker', 2]],
            }}
          />
        ) : null}
      </div>
    </div>
  )
})
