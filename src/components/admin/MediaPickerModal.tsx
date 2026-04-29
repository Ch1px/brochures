'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SanityImage } from '@/types/brochure'
import { fetchImageAssetsAction, type ImageAssetRow } from '@/lib/sanity/actions'
import { urlFor } from '@/lib/sanity/image'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (image: SanityImage) => void
}

const PAGE_SIZE = 24

export function MediaPickerModal({ open, onClose, onSelect }: Props) {
  const [assets, setAssets] = useState<ImageAssetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // Fetch assets every time the modal opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSearch('')
    setPage(0)
    fetchImageAssetsAction()
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [open])

  // Lock body scroll and focus close button
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    if (!search.trim()) return assets
    const q = search.trim().toLowerCase()
    return assets.filter((a) =>
      (a.originalFilename ?? '').toLowerCase().includes(q),
    )
  }, [assets, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when search changes
  const prevSearch = useRef(search)
  if (prevSearch.current !== search) {
    prevSearch.current = search
    if (page !== 0) setPage(0)
  }

  const handleSelect = useCallback(
    (asset: ImageAssetRow) => {
      onSelect({
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      })
      onClose()
    },
    [onSelect, onClose],
  )

  if (!open) return null

  return (
    <div className="add-section-overlay" onClick={onClose} role="dialog">
      <div className="add-section-modal media-picker-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">Media</div>
            <h2 className="add-section-modal-title">Choose an image</h2>
          </div>
          <button ref={closeRef} className="add-section-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="media-picker-search">
          <input
            type="text"
            className="library-search-input"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="media-picker-body">
          {loading ? (
            <div className="library-empty">Loading assets...</div>
          ) : filtered.length === 0 ? (
            <div className="library-empty">
              {search ? 'No assets match your search.' : 'No images uploaded yet.'}
            </div>
          ) : (
            <>
              <div className="media-picker-grid">
                {paginated.map((asset) => {
                  const thumbUrl = urlFor(asset._id).width(300).height(300).fit('crop').auto('format').url()
                  const dims = asset.metadata?.dimensions
                  return (
                    <button
                      key={asset._id}
                      type="button"
                      className="media-asset-card media-asset-card-selectable"
                      onClick={() => handleSelect(asset)}
                    >
                      <div className="media-asset-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbUrl} alt={asset.originalFilename || 'Asset'} loading="lazy" />
                      </div>
                      <div className="media-asset-info">
                        <div className="media-asset-filename">{asset.originalFilename || 'Untitled'}</div>
                        <div className="media-asset-meta">
                          {dims ? `${dims.width} x ${dims.height}` : ''}
                        </div>
                      </div>
                    </button>
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
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
