'use client'

import { useEffect, useRef } from 'react'
import type { Section } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Wraps SectionRenderer with an IntersectionObserver that adds
 * `.is-active` to the rendered <section> the first time it enters the
 * viewport, then unobserves. The CSS keyed off `.section.is-active` runs
 * the fade-up + stagger animation on the section's children once.
 *
 * Why one-shot: the previous version also removed `is-active` on exit,
 * which replayed the animation on every scroll. On mobile this caused
 * sections to snap back to opacity:0 mid-scroll, producing a noticeable
 * stutter as the user moved through the page.
 *
 * The wrapper uses `display: contents` so it adds no box to the layout
 * — only its first child (the real <section>) is observed.
 */
export function AnimatedSection(props: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapRef.current
    if (!wrapper) return
    const target = wrapper.querySelector<HTMLElement>('section.section')
    if (!target) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            target.classList.add('is-active')
            io.unobserve(target)
          }
        }
      },
      { threshold: 0.2 }
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
