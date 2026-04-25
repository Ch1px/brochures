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
 *   - `> div > *`        — direct children of the section's inner
 *                           wrapper (catches sections whose immediate
 *                           children are content + the group containers
 *                           in sections that wrap their content).
 *   - `> div > div > *`  — grandchildren via a div container (catches
 *                           the per-element content inside those group
 *                           containers).
 */
const ANIMATABLE_SELECTOR = [
  ':scope > div:not(.page-brand-mark):not(.page-folio) > *',
  ':scope > div:not(.page-brand-mark):not(.page-folio) > div > *',
].join(', ')

const TRIGGER_RATIO = 0.9

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
  isActivePage: boolean
}

/**
 * Walks each animatable element and toggles `.is-in-view` based on
 * whether the element intersects the viewport. Reads are batched
 * before any writes to avoid layout thrashing.
 */
function syncVisibility(targets: NodeListOf<HTMLElement> | HTMLElement[]) {
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  const triggerY = vh * TRIGGER_RATIO
  const states: boolean[] = []
  for (let i = 0; i < targets.length; i++) {
    const rect = targets[i].getBoundingClientRect()
    states.push(
      rect.top < triggerY &&
        rect.bottom > 0 &&
        rect.left < vw &&
        rect.right > 0
    )
  }
  for (let i = 0; i < targets.length; i++) {
    const el = targets[i]
    const cls = el.classList
    if (states[i]) cls.add('is-in-view')
    else cls.remove('is-in-view')
  }
}

/**
 * Wraps SectionRenderer with per-element scroll-driven animation.
 *
 * The brochure has two motion patterns that need different handling:
 *
 *   1. Vertical scroll inside `.brochure-page` (overflow:auto). On
 *      mobile Safari, IntersectionObserver can be unreliable inside
 *      an overflow:auto container, so we layer a scroll-event-driven
 *      `syncVisibility` call on top — IO is the fast path, the scroll
 *      listener is the safety net.
 *
 *   2. Horizontal slider transition (`translateX` on an ancestor).
 *      IntersectionObserver doesn't fire for visibility changes caused
 *      by ancestor transforms at all, in any browser. When this
 *      section's page becomes active or inactive we rAF-poll each
 *      element's bounding rect for the duration of the slide and
 *      sync `.is-in-view` directly.
 *
 * Both mechanisms call the same `syncVisibility` helper which toggles
 * `.is-in-view` on every animatable element based on its current
 * viewport intersection. The CSS transition handles the actual fade
 * + translate, so animations naturally replay every time an element
 * crosses the trigger line.
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

    syncVisibility(targets)

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
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    )
    targets.forEach((t) => io.observe(t))

    const scrollContainer = sectionEl.closest('.brochure-page') as HTMLElement | null
    let scrollRaf = 0
    const onScroll = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        syncVisibility(targets)
      })
    }
    scrollContainer?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      io.disconnect()
      scrollContainer?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
    }
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

    let cancelled = false
    let raf = 0
    const start = performance.now()
    const tick = () => {
      if (cancelled) return
      syncVisibility(targets)
      if (performance.now() - start > 700) return
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
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
