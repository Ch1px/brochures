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
 * children fade up every time the section enters the viewport.
 *
 * Two parallel class flags, modelled on Foleon's pattern (the platform
 * F1 use for their hospitality brochures):
 *
 *   .is-active          — toggles on every viewport enter/exit. Drives
 *                         the lightweight fade-up animation, which
 *                         replays on each re-entry.
 *
 *   .has-been-active    — set once, never removed. Drives heavier
 *                         one-shot effects (image zoom). Replaying the
 *                         scale transform on every scroll caused mobile
 *                         stutter previously, so this class is sticky.
 *
 * Three triggers add the classes:
 *
 * 1. SYNC MOUNT CHECK (useLayoutEffect, before first paint).
 *    Pre-mark sections that are already in view so above-the-fold
 *    content isn't briefly blank between paint and the first IO callback.
 *
 * 2. INTERSECTION OBSERVER.
 *    The main driver. Adds .is-active + .has-been-active on entry,
 *    removes only .is-active on exit. Threshold 0.2 so the trigger
 *    fires when a meaningful chunk of the section is visible — not on
 *    a sliver of partial overlap, which would re-fire constantly
 *    during scroll.
 *
 * 3. PAGE-CHANGE POLL.
 *    IntersectionObserver doesn't reliably fire when an element comes
 *    into view via an ancestor's CSS transform (the slider). When this
 *    section's page becomes active, we poll its bounding rect each
 *    frame for the duration of the slide and explicitly add the
 *    classes the moment it crosses into the viewport.
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
      target.classList.add('has-been-active')
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            target.classList.add('is-active')
            target.classList.add('has-been-active')
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

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }
    const wrapper = wrapRef.current
    if (!wrapper) return
    const target = wrapper.querySelector<HTMLElement>('section.section')
    if (!target) return

    if (isActivePage) {
      // Page becoming active: poll for the moment the section crosses
      // into the viewport (during the slider's CSS transform transition,
      // since IntersectionObserver doesn't reliably fire on ancestor
      // transforms) and stamp the classes the instant it's visible.
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
          target.classList.add('has-been-active')
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
    }

    // Page becoming inactive: after the slide-out completes, strip
    // `.is-active` so the next time this page is navigated to the
    // section animates fresh from opacity:0 instead of the user briefly
    // seeing leftover content at full opacity. IntersectionObserver
    // doesn't reliably fire exit when the section is moved off-viewport
    // by an ancestor transform, so we do this explicitly. We delay until
    // the slide finishes (~500ms) so the section doesn't fade out while
    // it's still visually on screen during the transition.
    const timeout = window.setTimeout(() => {
      target.classList.remove('is-active')
    }, 500)
    return () => window.clearTimeout(timeout)
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
