'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Section } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Selector matching every individual element that should fade up as it
 * crosses the viewport. Mirrors the CSS rule in globals.css — keep them
 * in sync. `:scope` confines the search to descendants of the section.
 *
 * Two patterns cover every section type:
 *   - `> div > *`        — direct children of the section's inner
 *                           wrapper (catches sections whose immediate
 *                           children are content + the group containers
 *                           in sections that wrap their content).
 *   - `> div > div > *`  — grandchildren via a div container (catches
 *                           the per-element content inside those group
 *                           containers, e.g. cover-title, intro-eyebrow,
 *                           stat cells, package cards, day rows, etc.).
 */
const ANIMATABLE_SELECTOR = [
  ':scope > div:not(.page-brand-mark):not(.page-folio) > *',
  ':scope > div:not(.page-brand-mark):not(.page-folio) > div > *',
].join(', ')

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
  isActivePage: boolean
}

/**
 * Wraps SectionRenderer with per-element scroll-driven animation.
 *
 * Each animatable element inside the section gets its own
 * IntersectionObserver entry. As the element crosses the viewport edge
 * we toggle `.is-in-view`; the CSS transition does the fade + translate.
 * No manual stagger — the natural rhythm comes from elements crossing
 * the trigger line at different times as the user scrolls.
 *
 * Three triggers contribute, all converging on the same `.is-in-view`
 * class:
 *
 * 1. SYNC MOUNT CHECK (useLayoutEffect, before first paint).
 *    For elements already on screen at mount, mark them in-view
 *    immediately so above-the-fold content isn't blank between paint
 *    and the first IO callback.
 *
 * 2. INTERSECTION OBSERVER.
 *    Per-element observation. `rootMargin: '0px 0px -15% 0px'` shrinks
 *    the bottom of the trigger zone so the element fades in once it's
 *    a comfortable distance into the viewport rather than the moment
 *    a single pixel crosses. Threshold 0 fires on first contact.
 *
 * 3. PAGE-CHANGE POLL.
 *    IntersectionObserver doesn't reliably fire when an element enters
 *    via an ancestor's CSS transform (the slider). When this section's
 *    page becomes active, we rAF-poll each element's bounding rect for
 *    the duration of the slide and toggle `.is-in-view` directly.
 *    Mirror handler on isActivePage→false strips the class after
 *    slide-out so the next return animates fresh.
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
    const sectionEl = wrapper.querySelector<HTMLElement>('section.section')
    if (!sectionEl) return

    const targets = sectionEl.querySelectorAll<HTMLElement>(ANIMATABLE_SELECTOR)
    if (targets.length === 0) return

    const vw = window.innerWidth || document.documentElement.clientWidth
    const vh = window.innerHeight || document.documentElement.clientHeight
    targets.forEach((target) => {
      const rect = target.getBoundingClientRect()
      if (
        rect.top < vh &&
        rect.bottom > 0 &&
        rect.left < vw &&
        rect.right > 0
      ) {
        target.classList.add('is-in-view')
      }
    })

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view')
          } else {
            entry.target.classList.remove('is-in-view')
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -15% 0px' }
    )
    targets.forEach((t) => io.observe(t))

    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }
    const wrapper = wrapRef.current
    if (!wrapper) return
    const sectionEl = wrapper.querySelector<HTMLElement>('section.section')
    if (!sectionEl) return
    const targets = sectionEl.querySelectorAll<HTMLElement>(ANIMATABLE_SELECTOR)
    if (targets.length === 0) return

    if (isActivePage) {
      let cancelled = false
      let raf = 0
      const start = performance.now()

      const check = () => {
        if (cancelled) return
        const vh = window.innerHeight || document.documentElement.clientHeight
        targets.forEach((target) => {
          if (target.classList.contains('is-in-view')) return
          const rect = target.getBoundingClientRect()
          if (rect.top < vh && rect.bottom > 0) {
            target.classList.add('is-in-view')
          }
        })
        if (performance.now() - start > 700) return
        raf = requestAnimationFrame(check)
      }

      raf = requestAnimationFrame(check)
      return () => {
        cancelled = true
        cancelAnimationFrame(raf)
      }
    }

    const timeout = window.setTimeout(() => {
      targets.forEach((t) => t.classList.remove('is-in-view'))
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
