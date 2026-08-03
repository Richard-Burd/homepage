'use client'

import { useEffect, useState } from 'react'

import PieChartDesktop from './PieChartDesktop'
import BarChartMobile from './BarChartMobile'
import type { DomainsChartDatum } from './types'

export type { DomainsChartDatum } from './types'

const NARROW_VIEWPORT_PX = 500

type Props = {
  data: DomainsChartDatum[]
}

export default function PieAndBarCharts({ data }: Props) {
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${NARROW_VIEWPORT_PX - 1}px)`)

    function syncViewport() {
      setIsNarrowViewport(media.matches)
    }

    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  return (
    <div className="flex w-full max-w-172 flex-col self-center">
      {isNarrowViewport ? (
        <BarChartMobile data={data} />
      ) : (
        <PieChartDesktop data={data} />
      )}
    </div>
  )
}
