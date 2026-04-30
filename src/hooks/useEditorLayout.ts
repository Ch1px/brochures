'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gpgt-editor-layout-v1'
const MIN_WIDTH = 200
const MAX_WIDTH = 640

/**
 * Centred-frame width presets for the preview stage's device toggle. These
 * are the widths the brochure frame is constrained to, not the device's
 * physical resolution — the brochure is designed 16:10 landscape, so we keep
 * the aspect ratio and only vary the inline width to feed the brochure CSS's
 * container queries.
 */
export const PREVIEW_DEVICE_WIDTHS = {
  desktop: 1400,
  tablet: 1024,
  mobile: 390,
} as const

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile' | 'custom'

const PREVIEW_MIN = 280
const PREVIEW_MAX = 1600

type Layout = {
  leftWidth: number
  rightWidth: number
  leftCollapsed: boolean
  rightCollapsed: boolean
  previewDevice: PreviewDevice
  previewWidth: number
}

const DEFAULT: Layout = {
  leftWidth: 240,
  rightWidth: 420,
  leftCollapsed: false,
  rightCollapsed: false,
  previewDevice: 'desktop',
  previewWidth: PREVIEW_DEVICE_WIDTHS.desktop,
}

function clampWidth(w: number) {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(w)))
}

function clampPreviewWidth(w: number) {
  return Math.max(PREVIEW_MIN, Math.min(PREVIEW_MAX, Math.round(w)))
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
      const device = (parsed.previewDevice ?? DEFAULT.previewDevice) as PreviewDevice
      setLayout({
        leftWidth: clampWidth(parsed.leftWidth ?? DEFAULT.leftWidth),
        rightWidth: clampWidth(parsed.rightWidth ?? DEFAULT.rightWidth),
        leftCollapsed: !!parsed.leftCollapsed,
        rightCollapsed: !!parsed.rightCollapsed,
        previewDevice: device,
        previewWidth: clampPreviewWidth(parsed.previewWidth ?? DEFAULT.previewWidth),
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

  const setPreviewDevice = useCallback((device: PreviewDevice) => {
    setLayout((prev) => ({
      ...prev,
      previewDevice: device,
      // When picking a preset, snap the custom width to its width too so the
      // grip continues from a sensible place if the user drags afterwards.
      previewWidth:
        device === 'custom' ? prev.previewWidth : PREVIEW_DEVICE_WIDTHS[device],
    }))
  }, [])

  const setPreviewWidth = useCallback((w: number) => {
    setLayout((prev) => ({
      ...prev,
      previewDevice: 'custom',
      previewWidth: clampPreviewWidth(w),
    }))
  }, [])

  return {
    ...layout,
    setLeftWidth,
    setRightWidth,
    toggleLeft,
    toggleRight,
    setPreviewDevice,
    setPreviewWidth,
  }
}
