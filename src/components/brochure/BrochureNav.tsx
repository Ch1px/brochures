'use client'

import { useEffect, useRef, useState } from 'react'

type NavPage = { name: string; index: number }

type Props = {
  brand: string
  pages: NavPage[]
  currentIndex: number
  onPageClick: (idx: number) => void
}

/**
 * Top brochure nav — matches the builder's design:
 * - red-tick brand on the left (Formula1 bold uppercase)
 * - horizontal page links on the right, scroll with hidden scrollbar + edge fade
 * - active page has red underline
 * - on mobile (<720px) links collapse to a burger that opens a stacked menu
 */
export function BrochureNav({ brand, pages, currentIndex, onPageClick }: Props) {
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

  // Scroll active link into view horizontally
  useEffect(() => {
    const link = navRef.current?.querySelector<HTMLElement>('.brochure-nav-link.active')
    if (link) {
      requestAnimationFrame(() => {
        try {
          link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' })
        } catch {}
      })
    }
  }, [currentIndex])

  return (
    <nav ref={navRef} className="brochure-nav" data-nav-ctx="public">
      <div className="brochure-nav-brand">
        <img
          src="/textures/GPGT - LOGO -dark.png"
          alt=""
          className="brochure-nav-brand-logo"
        />
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
        className="brochure-nav-burger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((v) => !v)
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
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
