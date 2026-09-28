'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { LuPointer } from 'react-icons/lu'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import type { SchematicArtPair } from '@/data/schematic-visualization'
import { assetUrl } from '@/lib/assets'

type Props = {
  closed: { light: SchematicArtPair; dark: SchematicArtPair }
  open: SchematicArtPair
  alt: string
  workflowAlt: string
  revealLabel: string
  restoreLabel: string
}

type Overlay = 'pointer' | 'restore'
type Pending = 'reveal' | 'restore'

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

const frameEase = [0.22, 1, 0.36, 1] as const

function ArtPair({
  pair,
  alt,
  className,
}: {
  pair: SchematicArtPair
  alt: string
  className: string
}) {
  return (
    <div className={className}>
      <Image
        src={assetUrl(pair.mobile.src)}
        alt={alt}
        width={pair.mobile.width}
        height={pair.mobile.height}
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-contain min-[800px]:hidden"
      />
      <Image
        src={assetUrl(pair.desktop.src)}
        alt={alt}
        width={pair.desktop.width}
        height={pair.desktop.height}
        sizes="(min-width: 800px) 50vw, 100vw"
        className="absolute inset-0 hidden h-full w-full object-contain min-[800px]:block"
      />
    </div>
  )
}

export default function TreasureMapImage({
  closed,
  open,
  alt,
  workflowAlt,
  revealLabel,
  restoreLabel,
}: Props) {
  const reduceMotion = usePrefersReducedMotion()
  const [revealed, setRevealed] = useState(false)
  const [overlay, setOverlay] = useState<Overlay | null>('pointer')
  const pending = useRef<Pending | null>(null)
  const revealedRef = useRef(false)

  const iconDuration = reduceMotion ? 0 : 0.35
  const frameDuration = reduceMotion ? 0 : 0.7

  function requestReveal() {
    if (pending.current) return
    pending.current = 'reveal'
    setOverlay(null)
  }

  function requestRestore() {
    if (pending.current) return
    pending.current = 'restore'
    revealedRef.current = false
    setOverlay(null)
    setRevealed(false)
  }

  function onIconExitComplete() {
    if (pending.current !== 'reveal') return
    revealedRef.current = true
    setRevealed(true)
  }

  function onFrameAnimationComplete() {
    if (pending.current === 'reveal' && revealedRef.current) {
      setOverlay('restore')
      pending.current = null
    }
    if (pending.current === 'restore' && !revealedRef.current) {
      setOverlay('pointer')
      pending.current = null
    }
  }

  return (
    <div
      className={`relative w-full transition-[aspect-ratio] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        reduceMotion ? 'duration-0' : 'duration-700'
      } ${
        revealed
          ? 'aspect-[400/811] min-[800px]:aspect-[1000/721]'
          : 'aspect-[400/466] min-[800px]:aspect-[1000/741]'
      }`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: revealed ? 0 : 1 }}
        transition={{ duration: frameDuration, ease: frameEase }}
        aria-hidden={revealed}
        onAnimationComplete={onFrameAnimationComplete}
      >
        <ArtPair
          pair={closed.light}
          alt={alt}
          className="absolute inset-0 dark:hidden"
        />
        <ArtPair
          pair={closed.dark}
          alt={alt}
          className="absolute inset-0 hidden dark:block"
        />

        <AnimatePresence onExitComplete={onIconExitComplete}>
          {overlay === 'pointer' ? (
            <motion.button
              key="reveal"
              type="button"
              aria-label={revealLabel}
              className="pointer-events-auto absolute right-[22.5%] bottom-[7%] z-10 aspect-square w-[31%] cursor-zoom-in text-zinc-800 min-[800px]:right-[31%] min-[800px]:bottom-[1.5%] min-[800px]:w-[23.5%] dark:text-zinc-50"
              initial={{ opacity: 0 }}
              animate="rest"
              whileHover="hover"
              exit="exit"
              variants={overlayVariants}
              transition={{ duration: iconDuration, ease: 'easeOut' }}
              onClick={requestReveal}
            >
              <motion.span
                className="block size-full"
                variants={iconVariants}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <LuPointer aria-hidden className="size-full" />
              </motion.span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: frameDuration, ease: frameEase }}
        aria-hidden={!revealed}
        style={{ pointerEvents: revealed ? 'auto' : 'none' }}
      >
        <ArtPair pair={open} alt={workflowAlt} className="absolute inset-0" />
        {overlay === 'restore' ? (
          <button
            type="button"
            aria-label={restoreLabel}
            className="absolute inset-0 z-10 cursor-zoom-out"
            onClick={requestRestore}
          />
        ) : null}
      </motion.div>
    </div>
  )
}
