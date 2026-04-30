'use client'

import { useEffect, useRef, useState } from 'react'
import { useBrochureBranding } from './BrochureContext'

type Props = {
  src: string
  poster?: string
  className?: string
  /**
   * How close to the viewport (in px) the element must be before the video
   * starts loading. Higher = preload sooner. Defaults to 600px.
   */
  rootMargin?: string
}

/**
 * A poster-first `<video>` that only attaches its `src` and starts playback
 * when scrolled into view, then pauses + detaches when scrolled away.
 *
 * Why: the brochure renders all sections in the DOM at once. Multiple
 * autoplay loops (8+ on a long brochure) overwhelm Safari's per-tab decoder
 * and memory budget, triggering "A problem repeatedly occurred". This keeps
 * exactly one video active at a time without changing the slider.
 *
 * The poster image is rendered as the video's `poster`, so off-screen
 * sections still show the still frame — there's no visual flash when a
 * section comes into view and the source attaches.
 */
export function LazyVideo({ src, poster, className, rootMargin = '600px' }: Props) {
  const { staticExport } = useBrochureBranding()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [active, setActive] = useState(false)

  // In static-export mode (offline HTML capture) the runtime that would
  // attach src after IntersectionObserver fires is stripped. Render the
  // <video> eagerly with src + autoplay so the offline file plays when
  // viewed online and falls back to the poster when viewed offline (browsers
  // render the poster as soon as the src request fails). `preload="metadata"`
  // keeps initial load light when many videos are present.
  if (staticExport) {
    return (
      <video
        className={className}
        src={src}
        poster={poster}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
      />
    )
  }

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting)
        }
      },
      { rootMargin, threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (active) {
      if (el.getAttribute('src') !== src) el.setAttribute('src', src)
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      el.pause()
      // Detaching the source releases the decoder. Empty string is the
      // standardised "no source" value for HTMLMediaElement.
      if (el.hasAttribute('src')) {
        el.removeAttribute('src')
        el.load()
      }
    }
  }, [active, src])

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
    />
  )
}
