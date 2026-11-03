'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Gives a full-screen overlay its own history entry, so the browser's Back
 * button or back gesture closes the overlay instead of leaving the page. The
 * entry carries no URL, so the address bar and scroll position stay put.
 *
 * Returns the close function. Every in-page close control (X button, Escape)
 * must call it rather than clearing the open state directly, or the extra
 * entry is left behind and the next Back press appears to do nothing.
 */
export function useHistoryBackedOverlay(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  const entryPushedRef = useRef(false)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    window.history.pushState({ overlay: true }, '')
    entryPushedRef.current = true

    function onPopState() {
      entryPushedRef.current = false
      onCloseRef.current()
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      entryPushedRef.current = false
    }
  }, [open])

  return useCallback(() => {
    if (!entryPushedRef.current) {
      onCloseRef.current()
      return
    }
    // Cleared first so a second click can't pop a page the user meant to keep.
    entryPushedRef.current = false
    window.history.back()
  }, [])
}
