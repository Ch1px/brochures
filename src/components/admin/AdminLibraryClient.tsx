'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NewBrochureModal, type DuplicateSource } from './NewBrochureModal'

type BrochureRow = {
  _id: string
  title: string
  slug: string
  season: string
  event?: string
  status: 'draft' | 'published' | 'unpublished' | 'archived'
  publishedAt?: string
  featured?: boolean
  pageCount: number
}

type Props = {
  brochures: BrochureRow[]
}

/**
 * Client wrapper for the admin library. Handles the "New brochure" modal
 * and per-card "Duplicate" action. The library page (server component)
 * passes the pre-fetched list down.
 */
export function AdminLibraryClient({ brochures }: Props) {
  const [newOpen, setNewOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<DuplicateSource | null>(null)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.02em', margin: 0 }}>Brochures</h1>
          <div style={{ opacity: 0.55, fontSize: 13, marginTop: 4 }}>{brochures.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/studio"
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 4,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Open Studio
          </Link>
          <button
            onClick={() => setNewOpen(true)}
            style={{
              padding: '10px 16px',
              background: '#e10600',
              border: '1px solid #e10600',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            + New brochure
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {brochures.map((b) => (
          <div
            key={b._id}
            style={{
              position: 'relative',
              padding: 16,
              background: '#121214',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
            }}
          >
            <Link
              href={`/admin/brochures/${b._id}/edit`}
              style={{ display: 'block', color: '#fff', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    background: statusColor(b.status),
                    borderRadius: 2,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {b.status}
                </span>
                {b.featured ? <span style={{ color: '#e10600', fontSize: 10, letterSpacing: '0.14em' }}>★ FEATURED</span> : null}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{b.title}</div>
              <div style={{ opacity: 0.55, fontSize: 12 }}>
                {b.season} · {b.event ?? '—'} · {b.pageCount} {b.pageCount === 1 ? 'page' : 'pages'}
              </div>
              <div style={{ opacity: 0.35, fontSize: 11, marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>/{b.slug}</div>
            </Link>
            <button
              onClick={() =>
                setDuplicateSource({
                  id: b._id,
                  title: b.title,
                  slug: b.slug,
                  season: b.season,
                  event: b.event,
                })
              }
              title="Duplicate this brochure"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 2,
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              Duplicate
            </button>
          </div>
        ))}
      </div>

      {brochures.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', opacity: 0.55 }}>
          No brochures yet.{' '}
          <button
            onClick={() => setNewOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#e10600',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Create your first
          </button>
          .
        </div>
      ) : null}

      <NewBrochureModal open={newOpen} onClose={() => setNewOpen(false)} />
      <NewBrochureModal
        open={duplicateSource !== null}
        onClose={() => setDuplicateSource(null)}
        duplicateFrom={duplicateSource ?? undefined}
      />
    </>
  )
}

function statusColor(status: BrochureRow['status']) {
  switch (status) {
    case 'published':
      return 'rgba(34,197,94,0.2)'
    case 'draft':
      return 'rgba(255,179,64,0.2)'
    case 'unpublished':
      return 'rgba(148,163,184,0.18)'
    case 'archived':
      return 'rgba(100,116,139,0.18)'
  }
}
