export type DomainsChartDatum = {
  id: string
  label: string
  description: string
  value: number
  color: string
}

export type SegmentLayout = DomainsChartDatum & {
  y: number
  height: number
  midY: number
}
