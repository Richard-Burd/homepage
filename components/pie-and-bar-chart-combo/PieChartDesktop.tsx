'use client'

import { ResponsivePie } from '@nivo/pie'
import { motion, useInView } from 'motion/react'
import { useLocale } from 'next-intl'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

import {
  computePieInkShift,
  createLabelWidthMeasurer,
  measureRenderedInkShift,
  PIE_DESKTOP_BASE_HEIGHT,
  PIE_DESKTOP_BASE_WIDTH,
  PIE_DESKTOP_END_ANGLE_DEG,
  PIE_DESKTOP_LABELS_FONT_SIZE,
  PIE_DESKTOP_LINK_DIAGONAL,
  PIE_DESKTOP_LINK_OFFSET,
  PIE_DESKTOP_LINK_STRAIGHT,
  PIE_DESKTOP_LINK_TEXT_OFFSET,
  PIE_DESKTOP_MARGIN,
  PIE_DESKTOP_SKIP_ANGLE_DEG,
  PIE_DESKTOP_START_ANGLE_DEG,
} from './pieInkLayout'
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
const LEADER_ARM_THICKNESS = 2
const OFFSET_WHEN_SELECTED = 8
const DEFAULT_INNER_RADIUS = 0.5
const SLICE_STAGGER_MS = 180
const INK_MEASURE_SETTLE_MS = 900
const INK_MEASURE_SAMPLE_MS = 200
const INK_MEASURE_MAX_SAMPLES = 5

type Props = {
  data: DomainsChartDatum[]
  title: string
  subtitle: string
  onSelectSlice: (slice: DomainsChartDatum) => void
}

export default memo(function PieChartDesktop({
  data,
  title,
  subtitle,
  onSelectSlice,
}: Props) {
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartSurfaceRef = useRef<HTMLDivElement>(null)
  const inkShiftRef = useRef(0)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [width, setWidth] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [measuredShift, setMeasuredShift] = useState<number | null>(null)
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

  const pieScale =
    width == null ? 1 : Math.min(1, width / PIE_DESKTOP_BASE_WIDTH)
  const pieHeight = PIE_DESKTOP_BASE_HEIGHT * pieScale
  const scaledMargin = useMemo(
    () => ({
      top: PIE_DESKTOP_MARGIN.top * pieScale,
      right: PIE_DESKTOP_MARGIN.right * pieScale,
      bottom: PIE_DESKTOP_MARGIN.bottom * pieScale,
      left: PIE_DESKTOP_MARGIN.left * pieScale,
    }),
    [pieScale]
  )
  const showChart = width != null && width > 0 && visibleData.length > 0

  const plannedShift = useMemo(() => {
    if (width == null || width <= 0) return 0
    const measureText = createLabelWidthMeasurer(
      Math.max(1, PIE_DESKTOP_LABELS_FONT_SIZE * pieScale),
      fontFamily,
      containerRef.current
    )
    return computePieInkShift(
      data,
      {
        width,
        height: pieHeight,
        margin: scaledMargin,
        startAngleDeg: PIE_DESKTOP_START_ANGLE_DEG,
        endAngleDeg: PIE_DESKTOP_END_ANGLE_DEG,
        skipAngleDeg: PIE_DESKTOP_SKIP_ANGLE_DEG,
        linkOffset: PIE_DESKTOP_LINK_OFFSET * pieScale,
        diagonalLength: PIE_DESKTOP_LINK_DIAGONAL * pieScale,
        straightLength: PIE_DESKTOP_LINK_STRAIGHT * pieScale,
        textOffset: PIE_DESKTOP_LINK_TEXT_OFFSET * pieScale,
      },
      measureText
    )
  }, [data, fontFamily, pieHeight, pieScale, scaledMargin, width])

  useEffect(() => {
    setMeasuredShift(null)
  }, [width, data, fontFamily])

  useEffect(() => {
    if (!showChart || visibleCount !== data.length) return
    const surface = chartSurfaceRef.current
    if (!surface) return

    const frame = surface
    const outerLabels = data.map((slice) => slice.label)

    let cancelled = false
    let timeoutId = 0
    let frameId = 0

    function readInk() {
      return measureRenderedInkShift(frame, inkShiftRef.current, outerLabels)
    }

    function commitShift(next: number) {
      if (
        cancelled ||
        !Number.isFinite(next) ||
        Math.abs(next - inkShiftRef.current) < 0.5
      ) {
        return
      }
      setMeasuredShift(next)
    }

    async function scheduleRead() {
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      if (cancelled) return
      const settle = reduceMotion ? 0 : INK_MEASURE_SETTLE_MS
      const sampleGap = reduceMotion ? 0 : INK_MEASURE_SAMPLE_MS

      await new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, settle)
      })
      if (cancelled) return

      let last = readInk()
      commitShift(last)

      for (let sample = 1; sample < INK_MEASURE_MAX_SAMPLES; sample += 1) {
        await new Promise<void>((resolve) => {
          timeoutId = window.setTimeout(resolve, sampleGap)
        })
        if (cancelled) return
        const next = await new Promise<number>((resolve) => {
          frameId = window.requestAnimationFrame(() => resolve(readInk()))
        })
        if (Math.abs(next - last) < 0.5) {
          commitShift(next)
          return
        }
        last = next
        commitShift(last)
      }
    }

    void scheduleRead()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(frameId)
    }
  }, [data, fontFamily, reduceMotion, showChart, visibleCount, width])

  const inkShift = measuredShift ?? plannedShift
  inkShiftRef.current = inkShift

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-[22.4px]">
      <motion.div
        className="flex w-full flex-col items-center gap-[5.376px] text-center"
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
        <h2
          className="font-bold tracking-wide text-zinc-700 dark:text-zinc-50"
          style={{ fontFamily, fontSize: TITLE_FONT_SIZE }}
        >
          {title}
        </h2>
        <p className="text-[1.4rem] italic">{subtitle}</p>
      </motion.div>
      {/*
        Nivo fades entering arcs/labels with the same spring that grows them
        from zero width, so the fade is imperceptible (and the first slice
        skips the enter phase entirely). A one-run CSS animation on each SVG
        element overrides the spring-driven opacity attribute while it plays,
        making every slice and label visibly fade in as it moves into place.
      */}
      <div
        ref={chartSurfaceRef}
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
        <div
          className="h-full w-full"
          style={{ transform: `translateX(${inkShift}px)` }}
        >
          {showChart ? (
            <ResponsivePie
              data={visibleData}
              margin={scaledMargin}
              innerRadius={DEFAULT_INNER_RADIUS}
              startAngle={PIE_DESKTOP_START_ANGLE_DEG}
              endAngle={PIE_DESKTOP_END_ANGLE_DEG}
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
                    fontSize: Math.max(
                      1,
                      PIE_DESKTOP_LABELS_FONT_SIZE * pieScale
                    ),
                    fontFamily,
                    fill: labelTextColor,
                  },
                },
              }}
              arcLinkLabelsSkipAngle={PIE_DESKTOP_SKIP_ANGLE_DEG}
              arcLinkLabel={(datum) => String(datum.label)}
              arcLinkLabelsTextColor={labelTextColor}
              arcLinkLabelsThickness={Math.max(
                1,
                LEADER_ARM_THICKNESS * pieScale
              )}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLinkLabelsOffset={PIE_DESKTOP_LINK_OFFSET * pieScale}
              arcLinkLabelsTextOffset={PIE_DESKTOP_LINK_TEXT_OFFSET * pieScale}
              arcLinkLabelsDiagonalLength={PIE_DESKTOP_LINK_DIAGONAL * pieScale}
              arcLinkLabelsStraightLength={PIE_DESKTOP_LINK_STRAIGHT * pieScale}
              enableArcLabels
              arcLabelsSkipAngle={PIE_DESKTOP_SKIP_ANGLE_DEG}
              arcLabel={(datum) => `${datum.value}%`}
              arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2]],
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
})
