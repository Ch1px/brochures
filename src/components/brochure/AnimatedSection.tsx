'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Section } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Classes that fade up as they enter the viewport. Intentionally
 * narrow scope — eyebrows, the section-heading title, the cover page,
 * images, and decorative SVGs. Regular section titles and body text
 * stay static.
 *
 * Keep this list in sync with the matching CSS rule in globals.css.
 */
const ANIMATABLE_CLASSES = [
  // Eyebrows / taglines
  '.intro-eyebrow',
  '.stats-eyebrow',
  '.image-hero-eyebrow',
  '.closing-eyebrow',
  '.quote-profile-eyebrow',
  '.gallery-variant-eyebrow',
  '.circuit-map-eyebrow',
  '.text-center-eyebrow',
  '.linked-cards-eyebrow',
  '.section-heading-eyebrow',
  '.features-title-accent',
  // Section-heading title only
  '.section-heading-title',
  // Cover page — everything
  '.page-cover-bg',
  '.page-cover-frame',
  '.page-cover-svg-decor',
  '.cover-brand-lockup',
  '.cover-edition',
  '.cover-sup',
  '.cover-title',
  '.cover-tag',
  '.cover-cta',
  '.cover-ref',
  // Images
  '.package-image',
  '.feature-card-media',
  '.linked-card-bg',
  '.page-image-hero-bg',
  '.page-spotlight-image',
  '.quote-profile-photo',
  '.page-intro-right',
  '.gallery-item',
  '.gallery-hero-lead',
  '.gallery-hero-thumb',
  '.gallery-duo-item',
  // Decorative SVGs
  '.page-section-heading-svg-decor',
  '.page-spotlight-svg-decor',
  '.page-closing-svg',
  '.circuit-map-svg-wrap',
]

const ANIMATABLE_SELECTOR = ANIMATABLE_CLASSES.map((c) => `:scope ${c}`).join(', ')

const TRIGGER_RATIO = 0.9

/**
 * Toggles `.is-in-view` on each target based on its current viewport
 * intersection. Reads are batched before any writes to avoid layout
 * thrashing during scroll-event handlers.
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
    const cls = targets[i].classList
    if (states[i]) cls.add('is-in-view')
    else cls.remove('is-in-view')
  }
}

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
  isActivePage: boolean
}

/**
 * Wraps SectionRenderer with scroll-driven, per-element animation for
 * a curated subset of elements (see ANIMATABLE_CLASSES above).
 *
 * Three input signals all converge on `syncVisibility`, which toggles
 * `.is-in-view` based on each element's current viewport rect:
 *
 *   1. SYNC MOUNT (useLayoutEffect, before first paint).
 *      Pre-marks above-the-fold elements so they aren't blank between
 *      paint and the first IO callback.
 *
 *   2. INTERSECTION OBSERVER + DOCUMENT-LEVEL SCROLL CAPTURE.
 *      IO is the fast path on desktop. On mobile the brochure's
 *      layout means scroll events fire on a moving target — sometimes
 *      `.brochure-page`, sometimes the document, sometimes nothing
 *      detectable depending on iOS gesture state. So we also bind a
 *      capture-phase scroll listener on `document` plus `touchmove` /
 *      `resize` on `window`. Whichever fires first wins; whichever
 *      fires later is a cheap idempotent re-sync.
 *
 *   3. PAGE-CHANGE rAF POLL.
 *      The slider's `translateX` transition fires neither IO nor
 *      scroll events. When `isActivePage` flips we rAF-poll the rects
 *      for the duration of the slide so elements get `.is-in-view` as
 *      they cross into the viewport.
 *
 * The wrapper uses `display: contents` so it adds no box to the layout
 * — only its first child (the real <section>) is queried.
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

    let raf = 0
    const onSync = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        syncVisibility(targets)
      })
    }

    document.addEventListener('scroll', onSync, { passive: true, capture: true })
    window.addEventListener('resize', onSync, { passive: true })
    window.addEventListener('touchmove', onSync, { passive: true })

    return () => {
      io.disconnect()
      document.removeEventListener('scroll', onSync, true)
      window.removeEventListener('resize', onSync)
      window.removeEventListener('touchmove', onSync)
      if (raf) cancelAnimationFrame(raf)
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
      if (performance.now() - start > 800) return
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
