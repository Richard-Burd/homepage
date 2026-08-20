'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { usePrefersReducedMotion } from './shared'
import type { DomainsChartDatum } from './types'

const PANEL_ENTER_Y = 48
const PANEL_DURATION_S = 0.35

type Props = {
  slice: DomainsChartDatum | null
  onClose: () => void
}

export default function SliceDetailPanel({ slice, onClose }: Props) {
  const t = useTranslations('SliceDetailPanel')
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!slice) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [slice, onClose])

  const duration = reduceMotion ? 0 : PANEL_DURATION_S
  const transition = { duration, ease: [0.22, 1, 0.36, 1] as const }

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
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
            initial={{ opacity: 0, y: PANEL_ENTER_Y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: PANEL_ENTER_Y }}
            transition={transition}
          >
            <div className="pointer-events-auto mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <div
                className="flex flex-col gap-4 px-5 py-5 text-start"
                style={{ fontFamily: 'var(--font-roboto)' }}
              >
                <h3
                  id="slice-detail-title"
                  className="text-xl font-bold tracking-wide text-zinc-800 dark:text-zinc-50"
                >
                  {slice.label}
                </h3>
                <p className="text-base leading-relaxed font-normal text-zinc-600 dark:text-zinc-300">
                  {slice.description}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 self-start rounded-md px-1 py-1 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
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
