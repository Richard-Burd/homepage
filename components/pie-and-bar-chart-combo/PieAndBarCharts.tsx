'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import PieChartDesktop from './PieChartDesktop'
import BarChartMobile from './BarChartMobile'
import SliceDetailPanel from './SliceDetailPanel'
import { orderSlicesByIds } from './shared'
import type { DomainsChartDatum } from './types'

export type { DomainsChartDatum } from './types'

const NARROW_VIEWPORT_PX = 800

type Props = {
  data: DomainsChartDatum[]
  pieOrder: string[]
  title: string
  subtitle: string
}

export default function PieAndBarCharts({
  data,
  pieOrder,
  title,
  subtitle,
}: Props) {
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [selectedSlice, setSelectedSlice] = useState<DomainsChartDatum | null>(
    null
  )

  const pieData = useMemo(
    () => orderSlicesByIds(data, pieOrder),
    [data, pieOrder]
  )

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${NARROW_VIEWPORT_PX - 1}px)`)

    function syncViewport() {
      setIsNarrowViewport(media.matches)
    }

    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  const handleSelect = useCallback((slice: DomainsChartDatum) => {
    setSelectedSlice(slice)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedSlice(null)
  }, [])

  return (
    <div
      className={`flex w-full flex-col self-center ${isNarrowViewport ? 'max-w-172' : ''}`}
    >
      {isNarrowViewport ? (
        <BarChartMobile
          data={data}
          title={title}
          subtitle={subtitle}
          onSelectSlice={handleSelect}
          panelOpen={selectedSlice != null}
        />
      ) : (
        <PieChartDesktop
          data={pieData}
          title={title}
          subtitle={subtitle}
          onSelectSlice={handleSelect}
        />
      )}
      <SliceDetailPanel slice={selectedSlice} onClose={handleClose} />
    </div>
  )
}
