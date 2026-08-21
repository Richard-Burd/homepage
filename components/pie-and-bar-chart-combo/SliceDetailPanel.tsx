'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { IoClose } from 'react-icons/io5'

import {
  getLocaleFontFamily,
  isRtlLocale,
  usePrefersReducedMotion,
} from './shared'
import type { DomainsChartDatum } from './types'

const PANEL_ENTER_Y = 48
const PANEL_DURATION_S = 0.35
/** Max panel height in px; longer descriptions scroll inside. */
const MAX_HEIGHT = 420
const COLOR_SWATCH_SIZE = 16
const DESKTOP_MIN_PX = 800
/** Max panel width; matches Tailwind `max-w-lg`. */
const PANEL_MAX_WIDTH_PX = 512
/** Trailing viewport gutter on desktop (matches `sm:px-6`). */
const DESKTOP_VIEWPORT_GUTTER_PX = 24
/**
 * Fraction of the anchor box that sits on the inline-start side of the
 * panel's inline-start edge (LTR: left; RTL: right).
 */
const ANCHOR_INLINE_START_RATIO = 0.6

type Props = {
  slice: DomainsChartDatum | null
  onClose: () => void
  /**
   * 'center' (default): dialog is centered in the viewport.
   * 'side': on wide viewports (>=800px) the dialog docks to the inline-end
   * whitespace (right in LTR, left in RTL); below 800px it stays centered.
   * 'anchor': on wide viewports the panel's inline-start edge is placed at
   * 60% across `anchorRef`; below 800px it stays centered.
   */
  desktopPlacement?: 'center' | 'side' | 'anchor'
  /** Element whose box `desktopPlacement="anchor"` measures against. */
  anchorRef?: RefObject<HTMLElement | null>
}

export default function SliceDetailPanel({
  slice,
  onClose,
  desktopPlacement = 'center',
  anchorRef,
}: Props) {
  const t = useTranslations('SliceDetailPanel')
  const locale = useLocale()
  const isRtl = isRtlLocale(locale)
  const fontFamily = getLocaleFontFamily(locale)
  const reduceMotion = usePrefersReducedMotion()
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties | null>(null)

  useEffect(() => {
    if (!slice) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [slice, onClose])

  useLayoutEffect(() => {
    if (!slice || desktopPlacement !== 'anchor' || !anchorRef?.current) {
      setAnchorStyle(null)
      return
    }

    const node = anchorRef.current
    const media = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`)

    function measure() {
      if (!media.matches) {
        setAnchorStyle(null)
        return
      }
      const rect = node.getBoundingClientRect()
      const start = rect.width * ANCHOR_INLINE_START_RATIO
      const inlineStart = isRtl
        ? window.innerWidth - rect.right + start
        : rect.left + start
      const width = Math.min(
        PANEL_MAX_WIDTH_PX,
        Math.max(0, window.innerWidth - inlineStart - DESKTOP_VIEWPORT_GUTTER_PX)
      )
      setAnchorStyle({
        marginInlineStart: inlineStart,
        width,
        maxWidth: PANEL_MAX_WIDTH_PX,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)
    media.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      media.removeEventListener('change', measure)
    }
  }, [slice, desktopPlacement, anchorRef, isRtl])

  const duration = reduceMotion ? 0 : PANEL_DURATION_S
  const transition = { duration, ease: [0.22, 1, 0.36, 1] as const }
  const useAnchor = desktopPlacement === 'anchor' && anchorStyle != null

  return (
    <AnimatePresence>
      {slice ? (
        <>
          <motion.button
            key="slice-detail-backdrop"
            type="button"
            aria-label={t('close')}
            className="fixed inset-0 z-40 cursor-default bg-black/20 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={onClose}
          />
          <motion.div
            key="slice-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slice-detail-title"
            className={`pointer-events-none fixed inset-0 z-50 flex items-center ${
              useAnchor
                ? ''
                : `px-4 sm:px-6 ${
                    // justify-end follows the document direction, so 'side'
                    // docks to the right in LTR and to the left in RTL.
                    desktopPlacement === 'side'
                      ? 'justify-center min-[800px]:justify-end'
                      : 'justify-center'
                  }`
            }`}
            initial={{ opacity: 0, y: PANEL_ENTER_Y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: PANEL_ENTER_Y }}
            transition={transition}
          >
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`pointer-events-auto flex flex-col overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] ${
                useAnchor
                  ? ''
                  : `w-full max-w-lg ${
                      // mx-auto would re-center the panel inside the flex row,
                      // so drop it on wide viewports when docking to the side.
                      desktopPlacement === 'side'
                        ? 'mx-auto min-[800px]:mx-0'
                        : 'mx-auto'
                    }`
              }`}
              style={{ maxHeight: MAX_HEIGHT, ...anchorStyle }}
            >
              <div
                className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-5 text-start"
                style={{ fontFamily }}
              >
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className="shrink-0"
                    style={{
                      width: COLOR_SWATCH_SIZE,
                      height: COLOR_SWATCH_SIZE,
                      backgroundColor: slice.color,
                    }}
                    aria-hidden
                  />
                  <h3
                    id="slice-detail-title"
                    className="text-xl font-bold tracking-wide text-zinc-800 dark:text-zinc-50"
                  >
                    {slice.label}
                  </h3>
                </div>
                <p className="min-h-0 flex-1 overflow-y-auto text-base leading-relaxed font-normal text-zinc-600 dark:text-zinc-300">
                  {slice.description}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-md px-1 py-1 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                >
                  <span>{t('close')}</span>
                  <IoClose aria-hidden className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
