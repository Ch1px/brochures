'use client'

import { useRef, useState } from 'react'
import type { SanityImage } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { FieldLabel } from './FieldLabel'
import { MediaPickerModal } from '../MediaPickerModal'

type UploadResult = { ok: true; image: SanityImage } | { ok: false; error: string }

type Props = {
  label: string
  description?: string
  value: SanityImage | undefined
  onChange: (value: SanityImage | undefined) => void
  /** Width hint for the preview thumbnail (defaults 500). */
  previewWidth?: number
}

/**
 * Image slot with a live preview and full upload flow.
 * Clicking Upload opens a native file picker; the selected file is sent to
 * the `uploadImageAction` server action, which writes it to Sanity Storage
 * and returns a `{ _type: 'image', asset: { _ref } }` object we store on the field.
 *
 * Enforced limits (server-side): 20MB, image/* MIME only.
 */
export function FieldImage({ label, description, value, onChange, previewWidth = 500 }: Props) {
  const url = urlForSection(value, previewWidth)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

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
    <FieldLabel label={label} description={description}>
      <div className="field-image">
        <div className="field-image-preview">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          ) : (
            <div className="field-image-empty">No image</div>
          )}
          {uploading ? (
            <div className="field-image-loading">
              <span className="field-image-loading-dot" />
              <span>Uploading…</span>
            </div>
          ) : null}
        </div>
        <div className="field-image-actions">
          <button
            type="button"
            className="field-btn"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : url ? 'Replace' : 'Upload'}
          </button>
          <button
            type="button"
            className="field-btn"
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
          >
            Library
          </button>
          {url && !uploading ? (
            <button
              type="button"
              className="field-btn field-btn-ghost"
              onClick={() => onChange(undefined)}
            >
              Remove
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
            // Reset so picking the same file again still fires onChange
            e.target.value = ''
          }}
        />
        {error ? <div className="field-error">{error}</div> : null}
        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(image) => onChange(image)}
        />
      </div>
    </FieldLabel>
  )
}
