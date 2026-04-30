'use client'

import { useEffect, useRef, useState } from 'react'
import type { SaveStatus } from '@/hooks/useAutosave'

type Props = {
  status: SaveStatus
}

/**
 * Save-state surface in the bottom-right.
 *
 * - Ephemeral toast (2.5s) when a save completes or fails.
 * - Persistent banner with a Reload action when an autosave hits a
 *   revision conflict (another admin edited the same brochure). Stays
 *   visible because the in-memory state is now stale and any further
 *   edits the user makes will be lost on reload — they need to make
 *   that choice consciously.
 */
export function SaveToast({ status }: Props) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [variant, setVariant] = useState<'success' | 'error'>('success')
  const prevStatus = useRef(status)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prev = prevStatus.current
    prevStatus.current = status

    // Show toast when transitioning FROM saving TO saved/error
    if (prev === 'saving' && status === 'saved') {
      setMessage('Changes saved')
      setVariant('success')
      show()
    } else if (prev === 'saving' && status === 'error') {
      setMessage('Save failed — check connection')
      setVariant('error')
      show()
    }
  }, [status])

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), 2500)
  }

  if (status === 'conflict') {
    return (
      <div className="save-toast error show" role="alert" style={{ maxWidth: 360 }}>
        <span className="save-toast-icon">!</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong style={{ fontWeight: 600 }}>Another admin edited this brochure</strong>
          <span style={{ opacity: 0.85, fontSize: 12, lineHeight: 1.4 }}>
            Autosave paused. Reload to see their changes — your unsaved edits will be lost.
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              alignSelf: 'flex-start',
              marginTop: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className={`save-toast ${variant}${visible ? ' show' : ''}`}>
      <span className="save-toast-icon">{variant === 'success' ? '✓' : '!'}</span>
      {message}
    </div>
  )
}
