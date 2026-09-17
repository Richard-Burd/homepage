'use client'

import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import Image from 'next/image'
import {
  Children,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { assetUrl } from '@/lib/assets'

type ArticleProps = {
  children: ReactNode
  parallaxSrc: string
  parallaxAlt: string
  parallaxCaption: string
}

/**
 * Where the leader line meets the first line of a row's content. Each value is
 * the row's top padding plus half the first line box, so ticks and the spine
 * endpoints all land on the same baseline.
 */
const railAnchors = {
  // Rail cell py-8 (2rem) + half of a heading line.
  '--rail-title-anchor': '2.65rem',
  // Paragraph py-8 (2rem) + half of leading-loose at 1.125rem (1.125rem).
  '--rail-text-anchor': '3.125rem',
  // Image wrapper py-6.
  '--rail-media-anchor': '1.5rem',
} as CSSProperties

export default function SchematicArticle({
  children,
  parallaxSrc,
  parallaxAlt,
  parallaxCaption,
}: ArticleProps) {
  const articleRef = useRef<HTMLElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ['0%', '0%'] : ['-4%', '12%']
  )

  return (
    <article
      ref={articleRef}
      style={railAnchors}
      className="relative flex w-full flex-1 flex-col bg-zinc-200 pt-(--navbar-height,4.15rem) dark:bg-zinc-800"
    >
      {/* Pins to the viewport top, not below the navbar, which slides away on scroll. */}
      <div className="pointer-events-none sticky top-0 z-0 hidden h-dvh w-1/2 overflow-hidden min-[800px]:block">
        <ParallaxLayer
          src={parallaxSrc}
          alt={parallaxAlt}
          caption={parallaxCaption}
          y={y}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 min-[800px]:mt-[-100dvh] min-[800px]:grid-cols-2">
        {children}
      </div>
    </article>
  )
}

function ParallaxLayer({
  src,
  alt,
  caption,
  y,
}: {
  src: string
  alt: string
  caption: string
  y: MotionValue<string>
}) {
  const [status, setStatus] = useState<'pending' | 'loaded' | 'error'>(
    'pending'
  )

  return (
    <motion.div className="relative h-[130%] w-full" style={{ y }}>
      <div className="absolute inset-0 bg-teal-200 dark:bg-teal-950" />
      {status !== 'loaded' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-teal-950 dark:text-teal-50">
          <p className="text-lg">{caption}</p>
          <p className="mt-2 font-mono text-xs break-all opacity-80">{src}</p>
        </div>
      ) : null}
      <Image
        src={assetUrl(src)}
        alt={alt}
        fill
        sizes="50vw"
        priority
        className={`object-cover ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      <div className="absolute inset-0 bg-teal-200/35 dark:bg-teal-950/45" />
    </motion.div>
  )
}

/**
 * `start` begins at the page title's tick, `end` stops at the first line of the
 * final row, and `full` spans the cell so stacked rows read as one line.
 */
type SpineVariant = 'full' | 'start' | 'end'

type RailStartProps = {
  children?: ReactNode
  tick?: boolean
  align?: 'start' | 'center'
  hideWhenEmpty?: boolean
  spine?: SpineVariant
  endAnchor?: 'text' | 'media'
}

// Children.toArray drops null, undefined, and booleans.
function hasRenderableChildren(children: ReactNode) {
  return Children.toArray(children).length > 0
}

export function RailStart({
  children,
  tick = false,
  align = 'start',
  hideWhenEmpty = false,
  spine = 'full',
  endAnchor = 'text',
}: RailStartProps) {
  const hasContent = hasRenderableChildren(children)
  const empty = hideWhenEmpty && !hasContent

  return (
    <div
      className={`relative min-[800px]:pe-10 ${
        empty ? 'hidden min-[800px]:flex' : 'flex'
      } ${
        align === 'center' ? 'items-center' : 'items-start'
      } bg-teal-200 text-teal-950 min-[800px]:bg-transparent dark:bg-teal-950 dark:text-teal-50 min-[800px]:dark:bg-transparent`}
    >
      <LeaderSpine variant={spine} endAnchor={endAnchor} />
      {tick ? <LeaderTick /> : null}
      {hasContent ? (
        <div className="relative z-10 w-full px-4 py-6 min-[800px]:px-8 min-[800px]:py-8">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function RailEnd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-zinc-200 pb-3 min-[800px]:pb-4 dark:bg-zinc-800 ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  )
}

function LeaderSpine({
  variant,
  endAnchor,
}: {
  variant: SpineVariant
  endAnchor: 'text' | 'media'
}) {
  const extent =
    variant === 'start'
      ? 'top-(--rail-title-anchor) bottom-0'
      : variant === 'end'
        ? `top-0 ${
            endAnchor === 'media'
              ? 'h-(--rail-media-anchor)'
              : 'h-(--rail-text-anchor)'
          }`
        : 'inset-y-0'

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-e-5 z-20 hidden w-px bg-zinc-900 min-[800px]:block dark:bg-zinc-100 ${extent}`}
    />
  )
}

function LeaderTick() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-e-5 top-(--rail-title-anchor) z-20 hidden h-px w-8 bg-zinc-900 min-[800px]:block dark:bg-zinc-100"
    />
  )
}
