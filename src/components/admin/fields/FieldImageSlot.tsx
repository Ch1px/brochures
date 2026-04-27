'use client'

import { useRef, useState } from 'react'
import type { SanityImage } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'

type UploadResult = { ok: true; image: SanityImage } | { ok: false; error: string }

type Props = {
  /** Slot number to display, e.g. "Image 01" — purely visual, independent of the array index. */
  slotLabel: string
  value: SanityImage | undefined
  onChange: (value: SanityImage | undefined) => void
}

/**
 * Single numbered image slot — used by gallery editors that have a fixed
 * set of positions (Editorial, Grid, Duo, Hero). Uses the same upload pipeline
 * as FieldImage, just in a more compact layout that fits multiple per row.
 */
export function FieldImageSlot({ slotLabel, value, onChange }: Props) {
  const url = urlForSection(value, 400)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Filename': encodeURIComponent(file.name),
        },
        body: file,
      })
      const result = (await res.json()) as UploadResult
      if (result.ok) {
        onChange(result.image)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field-image-slot">
      <div className="field-image-slot-label">{slotLabel}</div>
      <div className="field-image-slot-preview">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <div className="field-image-slot-empty">Empty</div>
        )}
        {uploading ? (
          <div className="field-image-loading">
            <span className="field-image-loading-dot" />
          </div>
        ) : null}
      </div>
      <div className="field-image-slot-actions">
        <button
          type="button"
          className="field-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '…' : url ? 'Replace' : 'Upload'}
        </button>
        {url && !uploading ? (
          <button
            type="button"
            className="field-icon-btn danger"
            aria-label="Remove image"
            onClick={() => onChange(undefined)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {error ? <div className="field-error field-error-compact">{error}</div> : null}
    </div>
  )
}
