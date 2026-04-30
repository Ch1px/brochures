'use client'

import { useAdminTheme } from './AdminThemeProvider'

/**
 * Sun/moon button that flips the admin chrome between dark and light.
 * Consumed by the editor topbar and the admin library header.
 */
export function AdminThemeToggle() {
  const { theme, toggle } = useAdminTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8 1.5v2" />
        <path d="M8 12.5v2" />
        <path d="M1.5 8h2" />
        <path d="M12.5 8h2" />
        <path d="M3.4 3.4l1.4 1.4" />
        <path d="M11.2 11.2l1.4 1.4" />
        <path d="M3.4 12.6l1.4-1.4" />
        <path d="M11.2 4.8l1.4-1.4" />
      </g>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M13.2 9.4A5.2 5.2 0 0 1 6.6 2.8a.4.4 0 0 0-.6-.4 6 6 0 1 0 7.6 7.6.4.4 0 0 0-.4-.6Z"
        fill="currentColor"
      />
    </svg>
  )
}
