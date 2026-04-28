'use client'

import { useRef, useState, cloneElement, type ReactElement } from 'react'
import type { SanityImage } from '@/types/brochure'
import { useBrochureBranding } from './BrochureContext'

type Props = {
  sectionKey: string
  field: string
  hasImage: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: ReactElement<any>
}

/**
 * Wraps an image/video container to enable inline replace/remove in the editor.
 *
 * In public mode: returns children unchanged.
 * In editor mode: clones the child element and injects an overlay as an
 * additional child (no wrapper div that could break layout).
 */
export function InlineMedia({ sectionKey, field, hasImage, children }: Props) {
  const { editorMode, onInlineMediaEdit } = useBrochureBranding()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!editorMode || !onInlineMediaEdit) return children

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-Filename': encodeURIComponent(file.name),
        },
        body: file,
      })
      const data = await res.json()
      if (data.ok) {
        onInlineMediaEdit?.(sectionKey, field, data.image as SanityImage)
      }
    } catch (err) {
      console.error('Inline media upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    onInlineMediaEdit?.(sectionKey, field, undefined)
  }

  function handleReplace(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    fileRef.current?.click()
  }

  const overlay = (
    <div
      className={`inline-media-overlay${uploading ? ' uploading' : ''}`}
      key="__inline-media-overlay"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {uploading ? (
        <span className="inline-media-status">Uploading...</span>
      ) : hasImage ? (
        <div className="inline-media-actions">
          <button type="button" className="inline-media-btn" onClick={handleReplace}>Replace</button>
          <button type="button" className="inline-media-btn danger" onClick={handleRemove}>Remove</button>
        </div>
      ) : (
        <button type="button" className="inline-media-btn" onClick={handleReplace}>Upload image</button>
      )}
    </div>
  )

  // Clone the child element and inject the overlay as an additional child.
  // Also add the inline-media-host class for CSS hover targeting.
  const existingClassName = children.props?.className || ''
  const hostClass = `${existingClassName} inline-media-host`.trim()

  return cloneElement(children, {
    className: hostClass,
    children: (
      <>
        {children.props?.children}
        {overlay}
      </>
    ),
  })
}
