export const PIE_DESKTOP_BASE_WIDTH = 688
export const PIE_DESKTOP_BASE_HEIGHT = 380
export const PIE_DESKTOP_MARGIN = { top: 40, right: 200, bottom: 40, left: 140 }
export const PIE_DESKTOP_START_ANGLE_DEG = 8
export const PIE_DESKTOP_END_ANGLE_DEG = 368
export const PIE_DESKTOP_SKIP_ANGLE_DEG = 10
export const PIE_DESKTOP_LINK_OFFSET = 0
export const PIE_DESKTOP_LINK_DIAGONAL = 16
export const PIE_DESKTOP_LINK_STRAIGHT = 20
export const PIE_DESKTOP_LINK_TEXT_OFFSET = 6
export const PIE_DESKTOP_LABELS_FONT_SIZE = 19

const TWO_PI = Math.PI * 2

export type PieInkSlice = {
  label: string
  value: number
}

export type PieInkGeometry = {
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  startAngleDeg: number
  endAngleDeg: number
  skipAngleDeg: number
  linkOffset: number
  diagonalLength: number
  straightLength: number
  textOffset: number
}

function normalizeRadians(angle: number) {
  let normalized = angle % TWO_PI
  if (normalized < 0) normalized += TWO_PI
  return normalized
}

function isRightSide(linkAngle: number) {
  return linkAngle < Math.PI / 2 || linkAngle > 1.5 * Math.PI
}

/**
 * Horizontal shift that equalizes leftover space around the outer
 * slice labels. Positive values move the graphic to the right.
 */
export function computePieInkShift(
  slices: PieInkSlice[],
  geometry: PieInkGeometry,
  measureText: (label: string) => number
): number {
  if (geometry.width <= 0 || geometry.height <= 0 || slices.length === 0) {
    return 0
  }

  const innerWidth =
    geometry.width - geometry.margin.left - geometry.margin.right
  const innerHeight =
    geometry.height - geometry.margin.top - geometry.margin.bottom
  if (innerWidth <= 0 || innerHeight <= 0) return 0

  const outerRadius = Math.min(innerWidth, innerHeight) / 2
  const centerX = geometry.margin.left + innerWidth / 2
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  if (total <= 0) return 0

  const start = (geometry.startAngleDeg * Math.PI) / 180
  const span = ((geometry.endAngleDeg - geometry.startAngleDeg) * Math.PI) / 180
  const skip = (geometry.skipAngleDeg * Math.PI) / 180

  let minX = Infinity
  let maxX = -Infinity
  let cursor = start

  for (const slice of slices) {
    const sweep = (slice.value / total) * span
    const mid = cursor + sweep / 2
    cursor += sweep

    if (Math.abs(sweep) < skip) continue

    const linkAngle = normalizeRadians(mid - Math.PI / 2)
    const reach = outerRadius + geometry.linkOffset
    const diagonalX = Math.cos(linkAngle) * (reach + geometry.diagonalLength)
    const right = isRightSide(linkAngle)
    const elbowX =
      diagonalX + (right ? geometry.straightLength : -geometry.straightLength)
    const textWidth = measureText(slice.label)
    const inkX = right
      ? elbowX + geometry.textOffset + textWidth
      : elbowX - geometry.textOffset - textWidth

    const absoluteX = centerX + inkX
    if (absoluteX < minX) minX = absoluteX
    if (absoluteX > maxX) maxX = absoluteX
  }

  if (!Number.isFinite(minX) || maxX <= minX) return 0

  return geometry.width / 2 - (minX + maxX) / 2
}

export function measureRenderedInkShift(
  frame: HTMLElement,
  currentShift: number,
  outerLabels: Iterable<string>
): number {
  const frameRect = frame.getBoundingClientRect()
  if (frameRect.width <= 0) return currentShift

  const allowed = new Set(outerLabels)
  if (allowed.size === 0) return currentShift

  const texts = frame.querySelectorAll('svg text')
  let left = Infinity
  let right = -Infinity

  texts.forEach((node) => {
    const text = node.textContent?.trim() ?? ''
    if (!allowed.has(text)) return
    const rect = node.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    if (rect.left < left) left = rect.left
    if (rect.right > right) right = rect.right
  })

  if (!Number.isFinite(left) || right <= left) return currentShift

  const inkCenter = (left + right) / 2
  const frameCenter = frameRect.left + frameRect.width / 2
  return currentShift + (frameCenter - inkCenter)
}

export function createLabelWidthMeasurer(
  fontSizePx: number,
  fontFamily: string,
  probe: Element | null
): (label: string) => number {
  const fallback = (label: string) => label.length * fontSizePx * 0.52
  if (typeof document === 'undefined') return fallback

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return fallback

  const family = probe ? getComputedStyle(probe).fontFamily : fontFamily
  ctx.font = `${fontSizePx}px ${family}`
  return (label: string) => ctx.measureText(label).width
}
