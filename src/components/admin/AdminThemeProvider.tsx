'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'gpgt-admin-theme'

/**
 * Wraps admin pages and applies a `data-admin-theme="light|dark"` attribute
 * on `<html>`. The attribute is removed on unmount, so navigating from
 * /admin to a public route (`/[slug]`) doesn't accidentally style the
 * brochure reader with admin-chrome theme tokens.
 *
 * Initial theme is resolved client-side: localStorage > prefers-color-scheme
 * > dark fallback. There is a brief paint with the default token values
 * before hydration; we accept that for the admin UI rather than ship an
 * inline script in <head>.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'dark' on the server / first paint so SSR is deterministic.
  // Real preference is hydrated from localStorage in the effect below.
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
        return
      }
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      setThemeState(prefersLight ? 'light' : 'dark')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-admin-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-admin-theme')
    }
  }, [])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggle = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAdminTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Soft fallback: outside the provider (shouldn't happen in practice)
    // we report 'dark' and ignore writes. Avoids hard crashes during
    // refactors or unexpected mounts.
    return { theme: 'dark', setTheme: () => {}, toggle: () => {} }
  }
  return ctx
}
