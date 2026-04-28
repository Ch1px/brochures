'use client'

import { useEffect, useRef, useState } from 'react'
import type { SaveStatus } from '@/hooks/useAutosave'

type Props = {
  status: SaveStatus
}

/**
 * Ephemeral toast notification that appears briefly when a save completes
 * or fails. Sits in the bottom-right corner of the viewport.
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

  return (
    <div className={`save-toast ${variant}${visible ? ' show' : ''}`}>
      <span className="save-toast-icon">{variant === 'success' ? '✓' : '!'}</span>
      {message}
    </div>
  )
}
