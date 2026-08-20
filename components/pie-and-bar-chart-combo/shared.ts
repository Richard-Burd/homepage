import { useSyncExternalStore } from 'react'

import type { DomainsChartDatum, SegmentLayout } from './types'

export function getLocaleFontFamily(locale: string) {
  if (locale === 'ar') return 'var(--font-arabic)'
  if (locale === 'he') return 'var(--font-hebrew)'
  return 'var(--font-roboto)'
}

// Arabiv and Hebrew are right to left languages,
// so we need to flip the layout of the charts and labels
export function isRtlLocale(locale: string) {
  return locale === 'ar' || locale === 'he'
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false
  )
}

export function darkenHex(hex: string, amount = 0.45) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return hex
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16)
    return Math.round(value * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(2)}${channel(4)}`
}

export function orderSlicesByIds(
  data: DomainsChartDatum[],
  ids: string[]
): DomainsChartDatum[] {
  const byId = new Map(data.map((slice) => [slice.id, slice]))
  return ids.flatMap((id) => {
    const slice = byId.get(id)
    return slice ? [slice] : []
  })
}

export function layoutSegments(
  data: DomainsChartDatum[],
  plotTop: number,
  plotHeight: number,
  gap: number
): SegmentLayout[] {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0 || data.length === 0) return []

  const gapTotal = gap * Math.max(0, data.length - 1)
  const usable = Math.max(0, plotHeight - gapTotal)
  let cursor = plotTop

  return data.map((datum, index) => {
    const height = (datum.value / total) * usable
    const y = cursor
    cursor += height + (index < data.length - 1 ? gap : 0)
    return { ...datum, y, height, midY: y + height / 2 }
  })
}

export function useIsDarkMode() {
  return useSyncExternalStore(
    (onChange) => {
      const root = document.documentElement
      const observer = new MutationObserver(onChange)
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class'],
      })
      return () => observer.disconnect()
    },
    () => document.documentElement.classList.contains('dark'),
    () => false
  )
}
