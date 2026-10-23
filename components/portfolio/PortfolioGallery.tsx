'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuScan, LuX, LuZoomIn, LuZoomOut } from 'react-icons/lu'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'

type Viewer = import('openseadragon').Viewer

type PortfolioImage = {
  id: string
  previewUrl: string
  fullUrl: string
}

type Props = {
  images: PortfolioImage[]
  returnHref: string
}

const controlClassName =
  'inline-flex size-11 cursor-pointer items-center justify-center rounded border border-white/25 bg-black/70 text-white outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default disabled:opacity-40'

function fullImageZoomRatio(viewer: Viewer, imageAspect: number) {
  const size = viewer.viewport.getContainerSize()
  if (size.y <= 0) return 1
  const aspectFactor = imageAspect / (size.x / size.y)
  const ratio = aspectFactor >= 1 ? 1 / aspectFactor : aspectFactor
  return ratio * 0.999
}

export default function PortfolioGallery({ images, returnHref }: Props) {
  const reduceMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const viewerNodeRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [items, setItems] = useState(images)
  const [openId, setOpenId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const openImage = items.find((item) => item.id === openId)

  useEffect(() => {
    const mountId = Symbol()
    const root = window as Window & { __portfolioMount?: symbol }
    root.__portfolioMount = mountId

    function wipe() {
      viewerRef.current?.destroy()
      viewerRef.current = null
      rootRef.current?.querySelectorAll('img').forEach((image) => {
        image.removeAttribute('src')
      })
      setItems([])
      setOpenId(null)
    }

    function lock() {
      wipe()
      navigator.sendBeacon('/api/portfolio/lock')
    }

    function onPageHide() {
      lock()
    }

    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      wipe()
      window.location.replace(returnHref)
    }

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)

    let cancelled = false
    void fetch('/api/portfolio/session', { cache: 'no-store' }).then(
      (response) => {
        if (!cancelled && !response.ok) window.location.replace(returnHref)
      }
    )

    return () => {
      cancelled = true
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      window.setTimeout(() => {
        if (root.__portfolioMount !== mountId) return
        navigator.sendBeacon('/api/portfolio/lock')
      }, 150)
    }
  }, [returnHref])

  useEffect(() => {
    if (!openImage) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [openImage])

  useEffect(() => {
    if (!openImage) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openImage])

  useEffect(() => {
    if (!openImage) return
    const node = viewerNodeRef.current
    if (!node) return

    let cancelled = false
    let viewer: Viewer | null = null
    const url = openImage.fullUrl

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
        crossOriginPolicy: 'Anonymous',
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
          url,
        },
      })
      viewer = created
      const viewport = created.viewport as Viewer['viewport'] & {
        minZoomImageRatio: number
      }
      const allowFullImage = () => {
        const item = created.world.getItemAt(0)
        const content = item?.getContentSize()
        if (!content || content.y <= 0) return
        viewport.minZoomImageRatio = fullImageZoomRatio(
          created,
          content.x / content.y
        )
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
      if (viewerRef.current === viewer) viewerRef.current = null
      setReady(false)
    }
  }, [openImage, reduceMotion])

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
    <div ref={rootRef} className="flex w-full flex-col gap-8 py-8">
      {items.map((image, index) => (
        <button
          key={image.id}
          type="button"
          aria-label={`Open image ${index + 1}`}
          onClick={() => {
            setReady(false)
            setOpenId(image.id)
          }}
          className="mx-auto block w-1/2 cursor-zoom-in bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white"
        >
          {/* The signed URL is the access grant. A plain img avoids the
              Next image optimizer caching a public copy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            draggable={false}
            decoding="async"
            className="pointer-events-none h-auto w-full border-4 border-zinc-600 shadow-xl"
          />
        </button>
      ))}
      {openImage
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Image ${items.findIndex((item) => item.id === openImage.id) + 1}`}
              className="fixed inset-0 z-70 bg-zinc-950"
            >
              <div ref={viewerNodeRef} className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end p-3">
                <div className="pointer-events-auto flex gap-2">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    className={controlClassName}
                    disabled={!ready}
                    onClick={() => zoomBy(1.4)}
                  >
                    <LuZoomIn aria-hidden className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    className={controlClassName}
                    disabled={!ready}
                    onClick={() => zoomBy(1 / 1.4)}
                  >
                    <LuZoomOut aria-hidden className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Show the whole image"
                    className={controlClassName}
                    disabled={!ready}
                    onClick={showWholeDiagram}
                  >
                    <LuScan aria-hidden className="size-5" />
                  </button>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close"
                    className={controlClassName}
                    onClick={() => setOpenId(null)}
                  >
                    <LuX aria-hidden className="size-5" />
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
