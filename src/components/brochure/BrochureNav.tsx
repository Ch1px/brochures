'use client'

import { useEffect, useRef, useState } from 'react'
import type { BrochureTheme, SanityImage } from '@/types/brochure'
import { LogoMark } from './LogoMark'

type NavPage = { name: string; index: number }

type Props = {
  brand: string
  pages: NavPage[]
  currentIndex: number
  onPageClick: (idx: number) => void
  logo?: SanityImage
  theme: BrochureTheme
}

/**
 * Top brochure nav — matches the builder's design:
 * - red-tick brand on the left (Formula1 bold uppercase)
 * - horizontal page links on the right, scroll with hidden scrollbar + edge fade
 * - active page has red underline
 * - on mobile (<720px) links collapse to a burger that opens a stacked menu
 */
export function BrochureNav({ brand, pages, currentIndex, onPageClick, logo, theme }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)

  // Close menu on outside tap
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!navRef.current) return
      if (!navRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Scroll active link into view horizontally (smooth)
  useEffect(() => {
    const link = navRef.current?.querySelector<HTMLElement>('.brochure-nav-link.active')
    if (link) {
      requestAnimationFrame(() => {
        try {
          link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
        } catch {}
      })
    }
  }, [currentIndex])

  // Edge-hover auto-scroll: when the mouse enters the left or right hot zone
  // of the links row, the row scrolls in that direction continuously until
  // the cursor leaves the zone. Speed ramps up the closer to the edge you
  // get, mirroring the hospitality-brochure nav pattern.
  useEffect(() => {
    const linksEl = navRef.current?.querySelector<HTMLElement>('.brochure-nav-links')
    if (!linksEl) return

    let raf = 0
    let velocity = 0 // px per frame; negative = scroll left, positive = scroll right
    const MAX_SPEED = 14
    const HOT_ZONE_PX = 100 // size of the active edge region

    const tick = () => {
      if (velocity === 0) {
        raf = 0
        return
      }
      if (linksEl.scrollWidth > linksEl.clientWidth) {
        linksEl.scrollLeft += velocity
      }
      raf = requestAnimationFrame(tick)
    }

    const setVelocity = (v: number) => {
      velocity = v
      if (v !== 0 && raf === 0) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const rect = linksEl.getBoundingClientRect()
      const x = e.clientX - rect.left
      const hot = Math.min(HOT_ZONE_PX, rect.width * 0.25)
      if (x < hot) {
        // Closer to left edge → faster left scroll. depth ∈ (0, 1].
        const depth = 1 - x / hot
        setVelocity(-MAX_SPEED * depth)
      } else if (x > rect.width - hot) {
        const depth = 1 - (rect.width - x) / hot
        setVelocity(MAX_SPEED * depth)
      } else {
        setVelocity(0)
      }
    }

    const onLeave = () => setVelocity(0)

    linksEl.addEventListener('mousemove', onMove)
    linksEl.addEventListener('mouseleave', onLeave)
    return () => {
      linksEl.removeEventListener('mousemove', onMove)
      linksEl.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <nav ref={navRef} className="brochure-nav" data-nav-ctx="public">
      <div className="brochure-nav-brand">
        <LogoMark logo={logo} theme={theme} className="brochure-nav-brand-logo" />
        <span className="brochure-nav-brand-name">{brand}</span>
      </div>

      <div className="brochure-nav-links">
        {pages.map((p) => (
          <button
            key={p.index}
            type="button"
            className={`brochure-nav-link ${p.index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setMenuOpen(false)
              onPageClick(p.index)
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`brochure-nav-burger${menuOpen ? ' is-open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((v) => !v)
        }}
      >
        <span className="brochure-nav-burger-bar" aria-hidden />
        <span className="brochure-nav-burger-bar" aria-hidden />
        <span className="brochure-nav-burger-bar" aria-hidden />
      </button>

      <div className={`brochure-nav-menu ${menuOpen ? 'open' : ''}`} role="menu">
        {pages.map((p) => (
          <button
            key={p.index}
            type="button"
            className={`brochure-nav-menu-item ${p.index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setMenuOpen(false)
              onPageClick(p.index)
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </nav>
  )
}
