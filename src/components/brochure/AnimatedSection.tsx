'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Section } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Wraps SectionRenderer with viewport detection so each section's
 * children fade up the first time the section becomes visible.
 *
 * Two-step check, both running before the browser's first paint:
 *
 * 1. Synchronously read the section's bounding rect. If it's already in
 *    the viewport (above-the-fold), add `.is-active` immediately — the
 *    animation then starts coupled to first paint instead of waiting on
 *    an IntersectionObserver callback that fires a tick later. Without
 *    this, mobile users see the section background for a beat with the
 *    content area still at opacity:0 before the fade kicks in, which
 *    reads as a flash.
 *
 * 2. Sections off-screen at mount fall back to an IntersectionObserver
 *    with threshold 0, so the fade fires the moment any part of the
 *    section touches the viewport edge. One-shot: once active, we
 *    unobserve so scrolling away doesn't replay (replay caused the
 *    earlier mid-scroll stutter on mobile).
 *
 * The wrapper uses `display: contents` so it adds no box to the layout
 * — only its first child (the real <section>) is observed.
 */
export function AnimatedSection(props: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const wrapper = wrapRef.current
    if (!wrapper) return
    const target = wrapper.querySelector<HTMLElement>('section.section')
    if (!target) return

    const rect = target.getBoundingClientRect()
    const vw = window.innerWidth || document.documentElement.clientWidth
    const vh = window.innerHeight || document.documentElement.clientHeight
    const alreadyVisible =
      rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0

    if (alreadyVisible) {
      target.classList.add('is-active')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            target.classList.add('is-active')
            io.unobserve(target)
          }
        }
      },
      { threshold: 0 }
    )
    io.observe(target)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrapRef} style={{ display: 'contents' }}>
      <SectionRenderer {...props} />
    </div>
  )
}
