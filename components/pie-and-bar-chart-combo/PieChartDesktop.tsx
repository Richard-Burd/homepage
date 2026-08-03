'use client'

import { ResponsivePie } from '@nivo/pie'
import { useInView } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import {
  getLocaleFontFamily,
  useIsDarkMode,
  usePrefersReducedMotion,
} from './shared'
import type { DomainsChartDatum } from './types'

const TITLE_FONT_SIZE = 40
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
}

export default function PieChartDesktop({ data }: Props) {
  const t = useTranslations('DomainsPie')
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

    if (reduceMotion) {
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
  }, [isInView, data, reduceMotion])

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const tooltipBg = isDark ? '#18181b' : '#ffffff'
  const tooltipText = isDark ? '#f4f4f5' : '#333333'
  const tooltipShadow = isDark
    ? '0 1px 2px rgba(0, 0, 0, 0.5)'
    : '0 1px 2px rgba(0, 0, 0, 0.25)'

  const visibleData =
    visibleCount > 0 ? data.slice(data.length - visibleCount) : []

  const pieScale = width == null ? 1 : Math.min(1, width / BASE_WIDTH)
  const pieHeight = BASE_HEIGHT * pieScale
  const showChart = width != null && width > 0 && visibleData.length > 0

  return (
    <div className="flex w-full flex-col gap-4">
      <h2
        className="text-center font-bold tracking-wide text-zinc-700 dark:text-zinc-50"
        style={{ fontFamily, fontSize: TITLE_FONT_SIZE }}
      >
        {t('title')}
      </h2>
      <div
        ref={containerRef}
        dir="ltr"
        className="relative w-full overflow-visible"
        style={{ height: pieHeight }}
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
            theme={{
              labels: {
                text: {
                  fontSize: Math.max(1, LABELS_FONT_SIZE * pieScale),
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
            arcLinkLabelsThickness={Math.max(1, LEADER_ARM_THICKNESS * pieScale)}
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
}
