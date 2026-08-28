'use client'

import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { proxiedAssetUrl } from '@/lib/assets'

const ANIMATION_FILE = 'test-animation.json'

export default function TestAnimation() {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const isHoveringRef = useRef(false)
  /** 1 = forward loop, -1 = reverse loop */
  const directionRef = useRef<1 | -1>(1)
  const reduceMotion = usePrefersReducedMotion()
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(proxiedAssetUrl(ANIMATION_FILE))
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation')
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const playLooping = (direction: 1 | -1) => {
    const api = lottieRef.current
    if (!api) return

    directionRef.current = direction
    api.setDirection(direction)
    if (api.animationItem) api.animationItem.loop = true
    api.play()
    setIsPlaying(true)
  }

  const pauseAnimation = () => {
    lottieRef.current?.pause()
    setIsPlaying(false)
  }

  const handleMouseEnter = () => {
    if (reduceMotion) return

    isHoveringRef.current = true
    playLooping(directionRef.current)
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
    pauseAnimation()
  }

  const handleClick = () => {
    if (reduceMotion) return

    const nextDirection = directionRef.current === 1 ? -1 : 1
    playLooping(nextDirection)
  }

  const handleTogglePlayback = () => {
    if (reduceMotion) return

    if (isPlaying) {
      pauseAnimation()
      return
    }

    playLooping(directionRef.current)
  }

  const handleDomLoaded = () => {
    lottieRef.current?.goToAndStop(0, true)
  }

  if (loadError) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Could not load animation.
      </p>
    )
  }

  if (!animationData) {
    return (
      <div
        className="aspect-video w-full max-w-2xl animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700"
        aria-hidden
      />
    )
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div
        className="w-full cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="img"
        aria-label="Interactive test animation"
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          autoplay={false}
          loop={false}
          onDOMLoaded={handleDomLoaded}
          className="w-full"
        />
      </div>
      {!reduceMotion ? (
        <button
          type="button"
          onClick={handleTogglePlayback}
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 min-[800px]:hidden dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {isPlaying ? 'Stop Animation' : 'Start Animation'}
        </button>
      ) : null}
    </div>
  )
}
