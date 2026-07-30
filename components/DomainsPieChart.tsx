'use client'

import { ResponsivePie } from '@nivo/pie'
import { useEffect, useState } from 'react'

export type DomainsPieDatum = {
  id: string
  label: string
  value: number
  color: string
}

type Props = {
  data: DomainsPieDatum[]
}

export default function DomainsPieChart({ data }: Props) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement

    function sync() {
      setIsDark(root.classList.contains('dark'))
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const labelTextColor = isDark ? '#e4e4e7' : '#333333'
  const tooltipBg = isDark ? '#18181b' : '#ffffff'
  const tooltipText = isDark ? '#f4f4f5' : '#333333'
  const tooltipShadow = isDark
    ? '0 1px 2px rgba(0, 0, 0, 0.5)'
    : '0 1px 2px rgba(0, 0, 0, 0.25)'

  return (
    <div className="relative left-1/2 h-[calc(min(100vw-2rem,43rem)-16.25rem)] w-[min(100vw-2rem,43rem)] max-w-none translate-x-[-55%] overflow-visible">
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 200, bottom: 40, left: 140 }}
        innerRadius={0.5}
        padAngle={0.6}
        cornerRadius={2}
        activeOuterRadiusOffset={8}
        colors={{ datum: 'data.color' }}
        theme={{
          labels: {
            text: {
              fontSize: 14,
              fill: labelTextColor,
            },
          },
          tooltip: {
            container: {
              background: tooltipBg,
              color: tooltipText,
              boxShadow: tooltipShadow,
            },
          },
        }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={labelTextColor}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLinkLabelsDiagonalLength={16}
        arcLinkLabelsStraightLength={20}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      />
    </div>
  )
}
