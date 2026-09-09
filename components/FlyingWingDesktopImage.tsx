'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { PiMagnifyingGlassPlus } from 'react-icons/pi'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'

type Props = {
  src: string
  alt: string
  expandLabel: string
  shrinkLabel: string
}

type Overlay = 'plus' | 'shrink'
type PendingZoom = 'expand' | 'collapse'

const COLUMN_MAX_WIDTH = '48rem'
const COLUMN_PADDING_PX = 16
const EXPANDED_PADDING_PX = 10
const ICON_REST_OPACITY = 0.22
const ICON_HOVER_OPACITY = 0.55

const overlayVariants = {
  rest: { scale: 1, opacity: 1 },
  hover: { scale: 1, opacity: 1 },
  exit: { scale: 1.18, opacity: 0 },
}

const iconVariants = {
  rest: { opacity: ICON_REST_OPACITY },
  hover: { opacity: ICON_HOVER_OPACITY },
  exit: { opacity: 0 },
}

export default function FlyingWingDesktopImage({
  src,
  alt,
  expandLabel,
  shrinkLabel,
}: Props) {
  const reduceMotion = usePrefersReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [overlay, setOverlay] = useState<Overlay | null>('plus')
  const pendingZoom = useRef<PendingZoom | null>(null)
  const expandedRef = useRef(false)

  const iconDuration = reduceMotion ? 0 : 0.35
  const expandDuration = reduceMotion ? 0 : 0.7

  function requestExpand() {
    if (pendingZoom.current) return
    pendingZoom.current = 'expand'
    setOverlay(null)
  }

  function requestCollapse() {
    if (pendingZoom.current) return
    pendingZoom.current = 'collapse'
    expandedRef.current = false
    setOverlay(null)
    setExpanded(false)
  }

  function onIconExitComplete() {
    if (pendingZoom.current !== 'expand') return
    expandedRef.current = true
    setExpanded(true)
  }

  function onImageAnimationComplete() {
    if (pendingZoom.current === 'expand' && expandedRef.current) {
      setOverlay('shrink')
      pendingZoom.current = null
    }
    if (pendingZoom.current === 'collapse' && !expandedRef.current) {
      setOverlay('plus')
      pendingZoom.current = null
    }
  }

  return (
    <motion.div
      className={`relative mx-auto hidden w-full min-[800px]:block ${
        expanded ? '' : 'bg-white dark:bg-black'
      }`}
      initial={false}
      animate={{
        maxWidth: expanded ? '100%' : COLUMN_MAX_WIDTH,
        paddingLeft: expanded ? EXPANDED_PADDING_PX : COLUMN_PADDING_PX,
        paddingRight: expanded ? EXPANDED_PADDING_PX : COLUMN_PADDING_PX,
      }}
      transition={{
        duration: expandDuration,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={onImageAnimationComplete}
    >
      <div className="relative my-6">
        <Image
          src={src}
          alt={alt}
          width={3000}
          height={1449}
          sizes="100vw"
          className="h-auto w-full"
          priority
        />

        <AnimatePresence onExitComplete={onIconExitComplete}>
          {overlay === 'plus' ? (
            <motion.button
              key="zoom-in"
              type="button"
              aria-label={expandLabel}
              className="absolute inset-0 z-10 flex cursor-zoom-in items-center justify-center"
              initial={{ opacity: 0 }}
              animate="rest"
              whileHover="hover"
              exit="exit"
              variants={overlayVariants}
              transition={{ duration: iconDuration, ease: 'easeOut' }}
              onClick={requestExpand}
            >
              <motion.span
                className="flex aspect-square w-[28%] items-center justify-center text-zinc-800"
                variants={iconVariants}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <PiMagnifyingGlassPlus aria-hidden className="size-full" />
              </motion.span>
            </motion.button>
          ) : null}
        </AnimatePresence>

        {overlay === 'shrink' ? (
          <button
            type="button"
            aria-label={shrinkLabel}
            className="absolute inset-0 z-10 cursor-zoom-out"
            onClick={requestCollapse}
          />
        ) : null}
      </div>
    </motion.div>
  )
}
