'use client'

import Image from 'next/image'
import { useState } from 'react'

import { assetUrl } from '@/lib/assets'

type Props = {
  src: string
  /** When set, shown only in dark mode; `src` is light-mode only. */
  darkSrc?: string
  alt: string
  caption?: string
  priority?: boolean
  className?: string
  minHeightClassName?: string
  width?: number
  height?: number
  /**
   * Fill the rail from the navbar to the bottom of the small viewport and
   * crop the sides. `svh` is used so mobile browser chrome show/hide does
   * not resize the crop. Without this, the image scales so the whole frame
   * stays in view.
   */
  viewportCover?: boolean
}

export default function SchematicAssetImage({
  src,
  darkSrc,
  alt,
  caption,
  priority,
  className,
  minHeightClassName = 'min-h-[12rem]',
  width = 1600,
  height = 900,
  viewportCover = false,
}: Props) {
  const [lightStatus, setLightStatus] = useState<
    'pending' | 'loaded' | 'error'
  >('pending')
  const [darkStatus, setDarkStatus] = useState<'pending' | 'loaded' | 'error'>(
    'pending'
  )

  const lightReady = lightStatus === 'loaded'
  const darkReady = !darkSrc || darkStatus === 'loaded'
  const showPlaceholder = !(lightReady && darkReady)
  const loadedImageClassName = viewportCover
    ? 'absolute inset-0 h-full w-full max-w-none object-cover object-center'
    : 'relative h-auto w-full'

  return (
    <div
      className={`relative overflow-hidden bg-rose-200 dark:bg-rose-900 ${
        viewportCover
          ? 'h-[calc(100svh-var(--navbar-height,4.15rem))]'
          : ''
      } ${className ?? ''}`}
    >
      {showPlaceholder ? (
        <div
          className={`flex ${minHeightClassName} flex-col items-center justify-center px-4 py-10 text-center text-rose-950 dark:text-rose-50`}
        >
          {caption ? (
            <p className="text-lg leading-snug min-[800px]:text-xl">
              {caption}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs break-all opacity-80">
            {darkSrc ? `${src} / ${darkSrc}` : src}
          </p>
        </div>
      ) : null}
      <Image
        src={assetUrl(src)}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 800px) 50vw, 100vw"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className={
          showPlaceholder
            ? 'absolute inset-0 h-full w-full object-cover opacity-0'
            : `${loadedImageClassName}${darkSrc ? ' dark:hidden' : ''}`
        }
        onLoad={() => setLightStatus('loaded')}
        onError={() => setLightStatus('error')}
      />
      {darkSrc ? (
        <Image
          src={assetUrl(darkSrc)}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 800px) 50vw, 100vw"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          className={
            showPlaceholder
              ? 'absolute inset-0 hidden h-full w-full object-cover opacity-0 dark:block'
              : `${loadedImageClassName} hidden dark:block`
          }
          onLoad={() => setDarkStatus('loaded')}
          onError={() => setDarkStatus('error')}
        />
      ) : null}
    </div>
  )
}
