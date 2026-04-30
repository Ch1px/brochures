'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CompanyEditModal, type CompanyFormSource } from './CompanyEditModal'
import { urlForSection } from '@/lib/sanity/image'
import type { SanityImage } from '@/types/brochure'

export type CompanyRow = {
  _id: string
  name: string
  slug?: string
  domain: string
  displayName: string
  website?: string
  accentColor?: string
  logo?: SanityImage
  brochureCount: number
}

type Props = {
  companies: CompanyRow[]
}

export function CompaniesAdminClient({ companies }: Props) {
  const [newOpen, setNewOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CompanyFormSource | null>(null)

  return (
    <>
      <div className="library-header">
        <div>
          <h1 className="library-title">Companies</h1>
          <div className="library-subtitle">
            {companies.length} total · brochures with no company stay on the canonical host
          </div>
        </div>
        <div className="library-header-actions">
          <Link href="/admin" className="library-header-btn">
            Brochures
          </Link>
          <button
            className="library-header-btn primary"
            onClick={() => setNewOpen(true)}
          >
            + New company
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--chrome-text-tertiary)',
          }}
        >
          No companies yet. Create one to host brochures on its own subdomain.
        </div>
      ) : (
        <div className="library-grid">
          {companies.map((c) => {
            const logoUrl = c.logo ? urlForSection(c.logo, 200) : null
            return (
              <button
                key={c._id}
                className="library-card"
                onClick={() =>
                  setEditTarget({
                    _id: c._id,
                    name: c.name,
                    slug: c.slug,
                    domain: c.domain,
                    displayName: c.displayName,
                    website: c.website,
                    accentColor: c.accentColor,
                    logo: c.logo,
                  })
                }
                style={{ textAlign: 'left' }}
              >
                <div
                  className="library-card-thumb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--chrome-raised)',
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--chrome-text-tertiary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {c.name.toUpperCase()}
                    </div>
                  )}
                  {c.accentColor ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: c.accentColor,
                        border: '2px solid rgba(255,255,255,0.2)',
                      }}
                    />
                  ) : null}
                </div>
                <div className="library-card-body">
                  <div className="library-card-title">{c.name}</div>
                  <div className="library-card-meta">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{c.domain}</span>
                  </div>
                  <div
                    className="library-card-meta"
                    style={{ marginTop: 4, color: 'var(--chrome-text-tertiary)' }}
                  >
                    {c.brochureCount} brochure{c.brochureCount === 1 ? '' : 's'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <CompanyEditModal open={newOpen} onClose={() => setNewOpen(false)} />
      <CompanyEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        source={editTarget ?? undefined}
      />
    </>
  )
}
