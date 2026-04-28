'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gpgt-editor-layout-v1'
const MIN_WIDTH = 200
const MAX_WIDTH = 560

type Layout = {
  leftWidth: number
  rightWidth: number
  leftCollapsed: boolean
  rightCollapsed: boolean
}

const DEFAULT: Layout = {
  leftWidth: 240,
  rightWidth: 360,
  leftCollapsed: false,
  rightCollapsed: false,
}

function clampWidth(w: number) {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(w)))
}

/**
 * Persists the editor's panel widths and collapsed state to localStorage so
 * each admin keeps their preferred layout across sessions. Initial render
 * uses defaults (server-safe) then re-hydrates from storage on mount.
 */
export function useEditorLayout() {
  const [layout, setLayout] = useState<Layout>(DEFAULT)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<Layout>
      setLayout({
        leftWidth: clampWidth(parsed.leftWidth ?? DEFAULT.leftWidth),
        rightWidth: clampWidth(parsed.rightWidth ?? DEFAULT.rightWidth),
        leftCollapsed: !!parsed.leftCollapsed,
        rightCollapsed: !!parsed.rightCollapsed,
      })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {}
  }, [layout])

  const setLeftWidth = useCallback((w: number) => {
    setLayout((prev) => ({ ...prev, leftWidth: clampWidth(w) }))
  }, [])

  const setRightWidth = useCallback((w: number) => {
    setLayout((prev) => ({ ...prev, rightWidth: clampWidth(w) }))
  }, [])

  const toggleLeft = useCallback(() => {
    setLayout((prev) => ({ ...prev, leftCollapsed: !prev.leftCollapsed }))
  }, [])

  const toggleRight = useCallback(() => {
    setLayout((prev) => ({ ...prev, rightCollapsed: !prev.rightCollapsed }))
  }, [])

  return {
    ...layout,
    setLeftWidth,
    setRightWidth,
    toggleLeft,
    toggleRight,
  }
}
