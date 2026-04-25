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
  isActivePage: boolean
}

/**
 * Wraps SectionRenderer with viewport detection so each section's
 * children fade up the first time the section becomes visible.
 *
 * Three triggers, each handling a different way a section can come into
 * view. All converge on adding `.is-active`, which the CSS keyframes
 * key off. One-shot — once added, it never comes back off, so scrolling
 * away doesn't replay the animation (replay caused the earlier mobile
 * mid-scroll stutter).
 *
 * 1. SYNC MOUNT CHECK (useLayoutEffect, before first paint).
 *    Read the bounding rect; if the section is already on screen,
 *    add `.is-active` immediately. Otherwise the IntersectionObserver
 *    callback would fire a tick after paint, leaving above-the-fold
 *    sections briefly blank.
 *
 * 2. INTERSECTION OBSERVER (threshold 0).
 *    Handles vertical scroll within a page — sections that scroll into
 *    view trigger their fade. Threshold 0 fires the moment any pixel
 *    crosses the viewport edge, so the animation feels coupled to scroll.
 *
 * 3. PAGE-CHANGE POLL.
 *    The slider brings new pages in via an ancestor `translateX`
 *    transition. IntersectionObserver does not reliably fire for
 *    visibility changes caused by ancestor transforms, so we explicitly
 *    poll the section's bounding rect each frame for the duration of
 *    the slide (~500ms). The instant the section's rect intersects the
 *    viewport we add `.is-active`. If it never does (below-the-fold of
 *    the new page), polling stops and IO from #2 will handle it when
 *    the user scrolls down.
 *
 * The wrapper uses `display: contents` so it adds no box to the layout
 * — only its first child (the real <section>) is observed.
 */
export function AnimatedSection({
  section,
  pageNum,
  total,
  showFolio,
  isActivePage,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const isFirstRunRef = useRef(true)

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

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }
    if (!isActivePage) return
    const wrapper = wrapRef.current
    if (!wrapper) return
    const target = wrapper.querySelector<HTMLElement>('section.section')
    if (!target) return
    if (target.classList.contains('is-active')) return

    let cancelled = false
    let raf = 0
    const start = performance.now()

    const check = () => {
      if (cancelled) return
      if (target.classList.contains('is-active')) return
      const rect = target.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const visible = rect.top < vh && rect.bottom > 0
      if (visible) {
        target.classList.add('is-active')
        return
      }
      if (performance.now() - start > 700) return
      raf = requestAnimationFrame(check)
    }

    raf = requestAnimationFrame(check)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [isActivePage])

  return (
    <div ref={wrapRef} style={{ display: 'contents' }}>
      <SectionRenderer
        section={section}
        pageNum={pageNum}
        total={total}
        showFolio={showFolio}
      />
    </div>
  )
}
