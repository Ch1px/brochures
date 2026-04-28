'use client'

import { useEffect, useRef } from 'react'

type Props = {
  imageUrl?: string
  videoUrl?: string
  parallax: boolean
}

/**
 * Background layer for the spotlight section. Lives in its own client
 * component so the parent `Spotlight` can stay as plain JSX. When `parallax`
 * is on, listens to scroll on the nearest scrollable ancestor and writes
 * `--spotlight-parallax` (px) on the layer; CSS picks that up to translate
 * the bg vertically. The layer is overflowed -10% top/bottom in CSS so the
 * translated image still covers the section frame.
 */
export function SpotlightBackground({ imageUrl, videoUrl, parallax }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!parallax) return
    const el = ref.current
    if (!el) return

    let scroller: HTMLElement | null = null
    for (let p = el.parentElement; p; p = p.parentElement) {
      const overflowY = getComputedStyle(p).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scroller = p
        break
      }
    }

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const viewportH = window.innerHeight
      const sectionCenter = rect.top + rect.height / 2
      const offset = (sectionCenter - viewportH / 2) * -0.25
      el.style.setProperty('--spotlight-parallax', `${offset}px`)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    const scrollTarget: HTMLElement | Window = scroller ?? window
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
      el.style.removeProperty('--spotlight-parallax')
    }
  }, [parallax])

  return (
    <div
      ref={ref}
      className={`page-spotlight-bg${parallax ? ' parallax' : ''}`}
      style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
    >
      {videoUrl ? (
        <video
          className="media-video"
          src={videoUrl}
          poster={imageUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : null}
    </div>
  )
}
