'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ImageAssetRow } from '@/lib/sanity/actions'
import { deleteImageAssetAction } from '@/lib/sanity/actions'
import { urlFor } from '@/lib/sanity/image'
import { AdminThemeToggle } from './AdminThemeToggle'

type Props = {
  assets: ImageAssetRow[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function MediaLibraryClient({ assets }: Props) {
  const router = useRouter()
  const [deletePending, startDeleteTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return assets
    const q = search.trim().toLowerCase()
    return assets.filter((a) =>
      (a.originalFilename ?? '').toLowerCase().includes(q),
    )
  }, [assets, search])

  const PAGE_SIZE = 24
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const filterKey = search
  const prevFilterKey = useRef(filterKey)
  if (prevFilterKey.current !== filterKey) {
    prevFilterKey.current = filterKey
    if (page !== 0) setPage(0)
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'X-Filename': encodeURIComponent(file.name),
          },
          body: file,
        })
      }
      router.refresh()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleDelete(asset: ImageAssetRow) {
    const name = asset.originalFilename || asset._id
    if (!confirm(`Delete "${name}"? This image may be used in brochures.`)) return
    startDeleteTransition(async () => {
      const res = await deleteImageAssetAction(asset._id)
      if (res.ok) {
        router.refresh()
      } else {
        alert(`Delete failed: ${'error' in res ? res.error : 'Unknown error'}`)
      }
    })
  }

  return (
    <>
      <div className="library-header">
        <div>
          <h1 className="library-title">Media Library</h1>
          <div className="library-subtitle">{assets.length} assets</div>
        </div>
        <div className="library-header-actions">
          <AdminThemeToggle />
          <Link href="/admin" className="library-header-btn">
            Brochures
          </Link>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            className="library-header-btn primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
        </div>
      </div>

      <div className="library-filters">
        <div className="library-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="library-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="library-search-input"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="library-body">
        <div className="media-grid">
          {paginated.map((asset) => {
            const thumbUrl = urlFor(asset._id).width(400).height(400).fit('crop').auto('format').url()
            const dims = asset.metadata?.dimensions
            return (
              <div key={asset._id} className="media-asset-card">
                <div className="media-asset-actions">
                  <button
                    className="library-card-action danger"
                    disabled={deletePending}
                    onClick={() => handleDelete(asset)}
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
                <div className="media-asset-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt={asset.originalFilename || 'Asset'} loading="lazy" />
                </div>
                <div className="media-asset-info">
                  <div className="media-asset-filename">{asset.originalFilename || 'Untitled'}</div>
                  <div className="media-asset-meta">
                    {dims ? `${dims.width} x ${dims.height}` : ''}
                    {dims && asset.size ? ' · ' : ''}
                    {asset.size ? formatBytes(asset.size) : ''}
                    {' · '}
                    {formatDate(asset._createdAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 ? (
          <div className="library-pagination">
            <button
              className="library-pagination-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <div className="library-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`library-pagination-page${page === i ? ' active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="library-pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Next
            </button>
            <span className="library-pagination-info">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
          </div>
        ) : null}

        {filtered.length === 0 && assets.length > 0 ? (
          <div className="library-empty">
            No assets match your search.{' '}
            <button className="library-empty-reset" onClick={() => setSearch('')}>
              Clear search
            </button>
          </div>
        ) : null}

        {assets.length === 0 ? (
          <div className="library-empty">
            No images uploaded yet.{' '}
            <button className="library-empty-reset" onClick={() => fileRef.current?.click()}>
              Upload your first
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
