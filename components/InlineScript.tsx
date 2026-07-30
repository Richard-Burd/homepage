'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

type Props = {
  html: string
}

/**
 * Emits a blocking inline script only during SSR / hydration.
 * On the client (including soft navigations like locale switches), renders
 * nothing — React never executes scripts inserted during client renders.
 *
 * @see https://nextjs.org/docs/app/guides/preventing-flash-before-hydration
 */
export function InlineScript({ html }: Props) {
  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  )

  if (!isServer) {
    return null
  }

  return <script dangerouslySetInnerHTML={{ __html: html }} />
}
