'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { Brochure, BrochureStatus, BrochureTheme } from '@/types/brochure'
import type { SaveStatus } from '@/hooks/useAutosave'
import {
  setBrochureStatusAction,
  setFeaturedBrochureAction,
  generatePreviewLinkAction,
} from '@/lib/sanity/actions'

type Props = {
  brochure: Brochure
  saveStatus: SaveStatus
  onTitleChange: (title: string) => void
  onStatusChange: (status: BrochureStatus) => void
  onThemeChange: (theme: BrochureTheme) => void
  onOpenSettings: () => void
}

const STATUS_LABEL: Record<BrochureStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived',
}

export function EditorTopbar({ brochure, saveStatus, onTitleChange, onStatusChange, onThemeChange, onOpenSettings }: Props) {
  const theme: BrochureTheme = brochure.theme ?? 'dark'
  const [pending, startTransition] = useTransition()
  const [publishMenu, setPublishMenu] = useState(false)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'generating' | 'copied' | 'error'>('idle')

  function handleStatus(next: BrochureStatus) {
    setPublishMenu(false)
    startTransition(async () => {
      const res = await setBrochureStatusAction(brochure._id, next, brochure.slug.current)
      if (res.ok) onStatusChange(next)
    })
  }

  function handleFeature() {
    startTransition(async () => {
      await setFeaturedBrochureAction(brochure._id)
    })
  }

  async function handleCopyPreviewLink() {
    setPreviewStatus('generating')
    try {
      const res = await generatePreviewLinkAction(brochure._id)
      if (!res.ok) {
        setPreviewStatus('error')
        setTimeout(() => setPreviewStatus('idle'), 2000)
        return
      }
      const fullUrl = `${window.location.origin}${res.url}`
      await navigator.clipboard.writeText(fullUrl)
      setPreviewStatus('copied')
      setTimeout(() => setPreviewStatus('idle'), 1800)
    } catch {
      setPreviewStatus('error')
      setTimeout(() => setPreviewStatus('idle'), 2000)
    }
  }

  return (
    <header className="editor-topbar">
      <div className="editor-topbar-left">
        <Link href="/admin" className="editor-topbar-back" aria-label="Back to library">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <input
          className="editor-topbar-title"
          value={brochure.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Brochure title"
        />
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="editor-topbar-right">
        <div className="editor-theme-toggle" role="group" aria-label="Brochure theme">
          <button
            type="button"
            className={`editor-theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`.trim()}
            onClick={() => onThemeChange('dark')}
            aria-pressed={theme === 'dark'}
            title="Dark theme"
          >
            Dark
          </button>
          <button
            type="button"
            className={`editor-theme-toggle-btn ${theme === 'light' ? 'active' : ''}`.trim()}
            onClick={() => onThemeChange('light')}
            aria-pressed={theme === 'light'}
            title="Light theme"
          >
            Light
          </button>
        </div>
        <StatusBadge status={brochure.status} />
        <div className="editor-topbar-menu-wrap">
          <button className="editor-topbar-btn" onClick={() => setPublishMenu((v) => !v)} disabled={pending}>
            Status ▾
          </button>
          {publishMenu ? (
            <div className="editor-topbar-menu">
              {(['draft', 'published', 'unpublished', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={brochure.status === s ? 'active' : ''}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          className="editor-topbar-btn"
          onClick={handleFeature}
          disabled={pending || brochure.status !== 'published'}
          title={brochure.status === 'published' ? 'Make this the site root redirect' : 'Must be published to feature'}
        >
          {brochure.featured ? '★ Featured' : 'Feature'}
        </button>

        <button
          className="editor-topbar-btn"
          onClick={onOpenSettings}
          title="Edit brochure settings (slug, SEO, lead capture…)"
        >
          Settings
        </button>

        <button
          className="editor-topbar-btn"
          onClick={handleCopyPreviewLink}
          disabled={previewStatus === 'generating'}
          title="Copy a signed preview URL (expires in 7 days)"
        >
          {previewStatus === 'generating'
            ? 'Generating…'
            : previewStatus === 'copied'
              ? '✓ Copied'
              : previewStatus === 'error'
                ? 'Failed'
                : 'Copy preview link'}
        </button>

        {brochure.status === 'published' ? (
          <a
            className="editor-topbar-btn primary"
            href={`/${brochure.slug.current}`}
            target="_blank"
            rel="noreferrer"
          >
            View live ↗
          </a>
        ) : null}
      </div>
    </header>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = status === 'saving' ? 'Saving…' : status === 'unsaved' ? 'Unsaved' : status === 'error' ? 'Save failed' : 'Saved'
  const color = status === 'error' ? '#ff5555' : status === 'unsaved' ? '#ffb340' : status === 'saving' ? '#60a5fa' : '#4ade80'
  return (
    <div className="editor-save-indicator">
      <span className="editor-save-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: BrochureStatus }) {
  const colors: Record<BrochureStatus, string> = {
    draft: 'rgba(255,179,64,0.18)',
    published: 'rgba(34,197,94,0.18)',
    unpublished: 'rgba(148,163,184,0.18)',
    archived: 'rgba(100,116,139,0.18)',
  }
  return (
    <span className="editor-status-badge" style={{ background: colors[status] }}>
      {STATUS_LABEL[status]}
    </span>
  )
}
