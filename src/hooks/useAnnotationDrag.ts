'use client'

import { useCallback, useRef, useState } from 'react'

type OnMove = (key: string, x: number, y: number) => void

export type DragInfo = { key: string; x: number; y: number } | null

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}

const ACTIVATION_DISTANCE = 4

/**
 * Custom drag hook for free-form 2D annotation positioning.
 * Returns `getHandleProps(key)` for each annotation and `dragInfo`
 * with the current drag coordinates (for showing a position tooltip).
 */
export function useAnnotationDrag(
  overlayRef: React.RefObject<HTMLDivElement | null>,
  onMove: OnMove,
) {
  const [dragInfo, setDragInfo] = useState<DragInfo>(null)

  const draggingRef = useRef<{
    key: string
    startX: number
    startY: number
    activated: boolean
    rafId: number | null
  } | null>(null)

  const getHandleProps = useCallback(
    (key: string) => ({
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()

        draggingRef.current = {
          key,
          startX: e.clientX,
          startY: e.clientY,
          activated: false,
          rafId: null,
        }

        const onMouseMove = (ev: MouseEvent) => {
          const state = draggingRef.current
          if (!state) return

          if (!state.activated) {
            const dx = ev.clientX - state.startX
            const dy = ev.clientY - state.startY
            if (Math.sqrt(dx * dx + dy * dy) < ACTIVATION_DISTANCE) return
            state.activated = true
            document.body.style.cursor = 'grabbing'
            document.body.style.userSelect = 'none'
          }

          if (state.rafId !== null) cancelAnimationFrame(state.rafId)
          state.rafId = requestAnimationFrame(() => {
            const overlay = overlayRef.current
            if (!overlay) return
            const rect = overlay.getBoundingClientRect()
            const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100)
            const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100)
            const rx = Math.round(x * 100) / 100
            const ry = Math.round(y * 100) / 100
            onMove(state.key, rx, ry)
            setDragInfo({ key: state.key, x: rx, y: ry })
          })
        }

        const onMouseUp = () => {
          const state = draggingRef.current
          if (state?.rafId !== null && state?.rafId !== undefined) {
            cancelAnimationFrame(state.rafId)
          }
          draggingRef.current = null
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
          setDragInfo(null)
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      },
    }),
    [overlayRef, onMove],
  )

  return { getHandleProps, dragInfo }
}
