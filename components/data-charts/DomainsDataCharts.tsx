'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import DomainsDesktopDataChart from './DomainsDesktopDataChart'
import DomainsMobileDataChart from './DomainsMobileDataChart'
import { getLocaleFontFamily } from './shared'
import type { DomainsChartDatum } from './types'

export type { DomainsChartDatum } from './types'

const NARROW_VIEWPORT_PX = 500

type Props = {
  data: DomainsChartDatum[]
}

export default function DomainsDataCharts({ data }: Props) {
  const t = useTranslations('DomainsPie')
  const locale = useLocale()
  const fontFamily = getLocaleFontFamily(locale)
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
    <div className="flex w-full max-w-172 flex-col gap-4 self-center">
      <h2
        className="text-center text-2xl font-bold tracking-wide text-zinc-700 sm:text-[2.5rem] dark:text-zinc-50"
        style={{ fontFamily }}
      >
        {t('title')}
      </h2>
      {isNarrowViewport ? (
        <DomainsMobileDataChart data={data} />
      ) : (
        <DomainsDesktopDataChart data={data} />
      )}
    </div>
  )
}
