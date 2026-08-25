import type { ReactNode } from 'react'

export type DomainsChartDatum = {
  id: string
  label: string
  description: ReactNode
  value: number
  color: string
}

export type SegmentLayout = DomainsChartDatum & {
  y: number
  height: number
  midY: number
}
