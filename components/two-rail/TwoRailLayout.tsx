'use client'

import { useRef, type ReactNode } from 'react'

import {
  railAnchorStyle,
  type RailAnchors,
} from '@/components/two-rail/LeaderLine'
import {
  ParallaxProvider,
  ParallaxRail,
  type ParallaxImage,
} from '@/components/two-rail/RailParallax'

type Props = {
  children: ReactNode
  parallax: ParallaxImage
  anchors?: RailAnchors
  className?: string
}

/**
 * Full-bleed two-rail shell. Desktop pairs each `RailStart` with the
 * `RailEnd` beside it in a 50/50 grid over a pinned parallax rail; below
 * 800px the same cells stack into one column.
 */
export default function TwoRailLayout({
  children,
  parallax,
  anchors,
  className,
}: Props) {
  const articleRef = useRef<HTMLElement>(null)

  return (
    <ParallaxProvider value={parallax}>
      <article
        ref={articleRef}
        style={railAnchorStyle(anchors)}
        className={`relative flex w-full flex-1 flex-col pt-(--navbar-height,4.15rem) ${
          className ?? ''
        }`}
      >
        <ParallaxRail image={parallax} scrollTarget={articleRef} />

        {/* A container, so the page title's offset can be measured against the
            rails' own width rather than the viewport's, which would fold in
            the scrollbar. */}
        <div className="@container relative z-10 grid grid-cols-1 min-[800px]:mt-[-100dvh] min-[800px]:grid-cols-2">
          {children}
        </div>
      </article>
    </ParallaxProvider>
  )
}
