'use client'

import { motion, useAnimationControls } from 'motion/react'
import { GrDocumentPdf } from 'react-icons/gr'

import { usePrefersReducedMotion } from '@/components/pie-and-bar-chart-combo/shared'

type Props = {
  href: string
  download: string
  ariaLabel: string
}

const linkClassName =
  'mx-4 mt-4 inline-flex items-center justify-center text-zinc-800 transition-opacity hover:opacity-70 dark:text-zinc-50'

export default function ResumePdfDownloadLink({
  href,
  download,
  ariaLabel,
}: Props) {
  const reduceMotion = usePrefersReducedMotion()
  const controls = useAnimationControls()

  async function handleClick() {
    if (reduceMotion) return
    await controls.start({
      scale: [1, 1.12, 1],
      transition: { duration: 0.35, ease: 'easeOut' },
    })
  }

  return (
    <motion.a
      href={href}
      download={download}
      aria-label={ariaLabel}
      className={linkClassName}
      animate={controls}
      onClick={() => {
        void handleClick()
      }}
    >
      <GrDocumentPdf aria-hidden className="size-28 shrink-0" />
    </motion.a>
  )
}
