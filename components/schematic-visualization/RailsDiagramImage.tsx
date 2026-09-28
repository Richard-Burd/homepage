'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuPointer, LuScan, LuX, LuZoomIn, LuZoomOut } from 'react-icons/lu'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'
import { assetUrl, proxiedAssetUrl } from '@/lib/assets'

type Props = {
  src: string
  width: number
  height: number
  diagramSrc: string
  diagramWidth: number
  diagramHeight: number
  alt: string
  openLabel: string
  closeLabel: string
  zoomInLabel: string
  zoomOutLabel: string
  fitLabel: string
  panHint: string
}

type Viewer = import('openseadragon').Viewer

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

/**
 * Home zoom fills the viewer and clips the long side. This ratio lets zoom-out
 * continue until the whole image fits, so a tall phone can show both side edges.
 */
function fullImageZoomRatio(viewer: Viewer, imageAspect: number) {
  const size = viewer.viewport.getContainerSize()
  if (size.y <= 0) return 1
  const aspectFactor = imageAspect / (size.x / size.y)
  const ratio = aspectFactor >= 1 ? 1 / aspectFactor : aspectFactor
  return ratio * 0.999
}

const controlClassName =
  'inline-flex size-11 cursor-pointer items-center justify-center rounded border border-white/25 bg-black/70 text-white outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default disabled:opacity-40'

export default function RailsDiagramImage({
  src,
  width,
  height,
  diagramSrc,
  diagramWidth,
  diagramHeight,
  alt,
  openLabel,
  closeLabel,
  zoomInLabel,
  zoomOutLabel,
  fitLabel,
  panHint,
}: Props) {
  const reduceMotion = usePrefersReducedMotion()
  const viewerNodeRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  const iconDuration = reduceMotion ? 0 : 0.35

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeViewer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function openViewer() {
    setReady(false)
    setOpen(true)
  }

  function closeViewer() {
    setReady(false)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const node = viewerNodeRef.current
    if (!node) return

    let cancelled = false
    let viewer: Viewer | null = null

    void import('openseadragon').then((imported) => {
      if (cancelled || !viewerNodeRef.current) return
      const createViewer =
        typeof imported === 'function' ? imported : imported.default
      const created = createViewer({
        element: viewerNodeRef.current,
        showNavigationControl: false,
        showZoomControl: false,
        homeFillsViewer: true,
        visibilityRatio: 0.5,
        minZoomImageRatio: 1,
        maxZoomPixelRatio: 4,
        constrainDuringPan: true,
        animationTime: reduceMotion ? 0 : 0.4,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: true,
          scrollToZoom: true,
          dragToPan: true,
        },
        gestureSettingsTouch: {
          clickToZoom: false,
          dblClickToZoom: true,
          pinchToZoom: true,
          dragToPan: true,
        },
        tileSources: {
          type: 'image',
          url: proxiedAssetUrl(diagramSrc),
        },
      })
      viewer = created
      const viewport = created.viewport as Viewer['viewport'] & {
        minZoomImageRatio: number
      }
      const imageAspect = diagramWidth / diagramHeight
      const allowFullImage = () => {
        viewport.minZoomImageRatio = fullImageZoomRatio(created, imageAspect)
      }
      created.addHandler('open', () => {
        if (cancelled) return
        allowFullImage()
        setReady(true)
      })
      created.addHandler('resize', allowFullImage)
      viewerRef.current = created
    })

    return () => {
      cancelled = true
      viewer?.destroy()
      viewerRef.current = null
    }
  }, [open, diagramSrc, diagramWidth, diagramHeight, reduceMotion])

  useEffect(() => {
    if (wasOpenRef.current && !open) openRef.current?.focus()
    wasOpenRef.current = open
  }, [open])

  function zoomBy(factor: number) {
    const viewport = viewerRef.current?.viewport
    if (!viewport) return
    viewport.zoomBy(factor)
    viewport.applyConstraints()
  }

  function showWholeDiagram() {
    const viewer = viewerRef.current
    const item = viewer?.world.getItemAt(0)
    if (!viewer || !item) return
    viewer.viewport.fitBounds(item.getBounds())
  }

  return (
    <div className="pointer-events-none relative">
      <Image
        src={assetUrl(src)}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 800px) 50vw, 100vw"
        className="pointer-events-auto h-auto w-full"
      />

      <AnimatePresence>
        {!open ? (
          <motion.button
            key="open-diagram"
            ref={openRef}
            type="button"
            aria-label={openLabel}
            className="pointer-events-auto absolute right-[22.5%] bottom-[7%] z-10 aspect-square w-[31%] cursor-zoom-in text-zinc-800 min-[800px]:right-[31%] min-[800px]:bottom-[1.5%] min-[800px]:w-[23.5%]"
            initial={{ opacity: 0 }}
            animate="rest"
            whileHover="hover"
            exit="exit"
            variants={overlayVariants}
            transition={{ duration: iconDuration, ease: 'easeOut' }}
            onClick={openViewer}
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

      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              className="fixed inset-0 z-60 bg-zinc-950"
            >
              <div ref={viewerNodeRef} className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end p-3">
                <div className="pointer-events-auto flex gap-2">
                  <button
                    type="button"
                    aria-label={zoomInLabel}
                    className={controlClassName}
                    disabled={!ready}
                    onClick={() => zoomBy(1.4)}
                  >
                    <LuZoomIn aria-hidden className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={zoomOutLabel}
                    className={controlClassName}
                    disabled={!ready}
                    onClick={() => zoomBy(1 / 1.4)}
                  >
                    <LuZoomOut aria-hidden className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={fitLabel}
                    className={controlClassName}
                    disabled={!ready}
                    onClick={showWholeDiagram}
                  >
                    <LuScan aria-hidden className="size-5" />
                  </button>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label={closeLabel}
                    className={controlClassName}
                    onClick={closeViewer}
                  >
                    <LuX aria-hidden className="size-5" />
                  </button>
                </div>
              </div>
              <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-sm text-white/80">
                {panHint}
              </p>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
