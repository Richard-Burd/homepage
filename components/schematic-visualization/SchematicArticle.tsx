'use client'

import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import Image from 'next/image'
import { Children, useRef, useState, type ReactNode } from 'react'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { assetUrl } from '@/lib/assets'

type ArticleProps = {
  children: ReactNode
  parallaxSrc: string
  parallaxAlt: string
  parallaxCaption: string
}

const STAGGER = 0.07
const SPINE_EASE = [0.22, 1, 0.36, 1] as const

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
      className="relative flex w-full flex-1 flex-col bg-zinc-200 pt-(--navbar-height,4.15rem) dark:bg-zinc-800"
    >
      <div className="pointer-events-none sticky top-(--navbar-height,4.15rem) z-0 hidden h-[calc(100dvh-var(--navbar-height,4.15rem))] w-1/2 overflow-hidden min-[800px]:block">
        <ParallaxLayer
          src={parallaxSrc}
          alt={parallaxAlt}
          caption={parallaxCaption}
          y={y}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 min-[800px]:-mt-[calc(100dvh-var(--navbar-height,4.15rem))] min-[800px]:grid-cols-2">
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

type RailStartProps = {
  children?: ReactNode
  rowIndex: number
  tick?: boolean
  align?: 'start' | 'center'
  hideWhenEmpty?: boolean
}

// Children.toArray drops null, undefined, and booleans.
function hasRenderableChildren(children: ReactNode) {
  return Children.toArray(children).length > 0
}

export function RailStart({
  children,
  rowIndex,
  tick = false,
  align = 'start',
  hideWhenEmpty = false,
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 inset-e-0 hidden w-10 bg-green-300 min-[800px]:block dark:bg-green-800"
      />
      <LeaderSpine delay={rowIndex * STAGGER} />
      {tick ? <LeaderTick delay={rowIndex * STAGGER} /> : null}
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

function LeaderSpine({ delay }: { delay: number }) {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 inset-e-5 z-20 hidden w-px origin-top bg-zinc-900 min-[800px]:block dark:bg-zinc-100"
      initial={reduceMotion ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : delay,
        ease: SPINE_EASE,
      }}
    />
  )
}

function LeaderTick({ delay }: { delay: number }) {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-e-5 top-[2.65rem] z-20 hidden h-px w-8 origin-right bg-zinc-900 min-[800px]:block rtl:origin-left dark:bg-zinc-100"
      initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : delay + 0.28,
        ease: 'easeOut',
      }}
    />
  )
}
