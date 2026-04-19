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
 * Wraps SectionRenderer with an IntersectionObserver that toggles
 * `.is-active` on the rendered <section> element whenever it enters or
 * leaves the viewport. The CSS keyed off `.section.is-active` runs the
 * fade-up + stagger animation on the section's children.
 *
 * Re-fires on every entry, so leaving and returning to a section replays
 * the animation. The wrapper uses `display: contents` so it adds no box
 * to the layout — only its first child (the real <section>) is observed.
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
          } else {
            target.classList.remove('is-active')
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
