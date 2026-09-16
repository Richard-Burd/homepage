'use client'

import Image from 'next/image'
import { useState } from 'react'

import { assetUrl } from '@/lib/assets'

type Props = {
  src: string
  alt: string
  caption?: string
  priority?: boolean
  className?: string
  minHeightClassName?: string
}

export default function SchematicAssetImage({
  src,
  alt,
  caption,
  priority,
  className,
  minHeightClassName = 'min-h-[12rem]',
}: Props) {
  const [status, setStatus] = useState<'pending' | 'loaded' | 'error'>(
    'pending'
  )

  return (
    <div
      className={`relative overflow-hidden bg-rose-200 dark:bg-rose-900 ${
        className ?? ''
      }`}
    >
      {status !== 'loaded' ? (
        <div
          className={`flex ${minHeightClassName} flex-col items-center justify-center px-4 py-10 text-center text-rose-950 dark:text-rose-50`}
        >
          {caption ? (
            <p className="text-lg leading-snug min-[800px]:text-xl">
              {caption}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs break-all opacity-80">{src}</p>
        </div>
      ) : null}
      <Image
        src={assetUrl(src)}
        alt={alt}
        width={1600}
        height={900}
        sizes="(min-width: 800px) 50vw, 100vw"
        priority={priority}
        className={
          status === 'loaded'
            ? 'relative h-auto w-full'
            : 'absolute inset-0 h-full w-full object-cover opacity-0'
        }
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}
