'use client'

import { useRef, useState } from 'react'
import type { SanityFile } from '@/types/brochure'
import { urlForFile } from '@/lib/sanity/image'
import { FieldLabel } from './FieldLabel'

type UploadResult = { ok: true; video: SanityFile } | { ok: false; error: string }

type Props = {
  label: string
  description?: string
  value: SanityFile | undefined
  onChange: (value: SanityFile | undefined) => void
}

/**
 * Video slot with a live preview and full upload flow. Mirrors FieldImage
 * but uploads via Sanity's `file` asset pipeline rather than `image`.
 *
 * Enforced limits (server-side): 50MB, video/* MIME only. For best results
 * use compressed short MP4/WebM loops; large or long videos belong on Mux.
 */
export function FieldVideo({ label, description, value, onChange }: Props) {
  const url = urlForFile(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Filename': encodeURIComponent(file.name),
        },
        body: file,
      })
      const result = (await res.json()) as UploadResult
      if (result.ok) {
        onChange(result.video)
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
            <video src={url} muted loop playsInline autoPlay />
          ) : (
            <div className="field-image-empty">No video</div>
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
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />
        {error ? <div className="field-error">{error}</div> : null}
      </div>
    </FieldLabel>
  )
}
