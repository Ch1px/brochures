'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Globe,
  Star,
  Settings,
  Link2,
  Download,
  ExternalLink,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  CloudCheck,
  CloudUpload,
  CloudOff,
  CircleDot,
} from 'lucide-react'
import type { Brochure, BrochureStatus } from '@/types/brochure'
import type { SaveStatus } from '@/hooks/useAutosave'
import type { CompanyOption } from './BrochureEditor'
import {
  setBrochureStatusAction,
  setFeaturedBrochureAction,
  generatePreviewLinkAction,
  deleteBrochureAction,
} from '@/lib/sanity/actions'
import { brochureHost } from '@/lib/brochureHost'
import { AdminThemeToggle } from './AdminThemeToggle'
import { PresenceAvatars } from './PresenceAvatars'

type Props = {
  brochure: Brochure
  companies: CompanyOption[]
  saveStatus: SaveStatus
  /** Whether the surrounding Liveblocks room is mounted. False in
   *  dev environments without `LIVEBLOCKS_SECRET_KEY` set; in that
   *  case the presence avatar stack is omitted. */
  liveblocksEnabled: boolean
  onTitleChange: (title: string) => void
  onStatusChange: (status: BrochureStatus, rev?: string) => void
  onFeatureChange: (featured: boolean, rev?: string) => void
  onOpenSettings: () => void
}

const STATUS_LABEL: Record<BrochureStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived',
}

const STATUS_DOT: Record<BrochureStatus, string> = {
  draft: '#ffb340',
  published: '#22c55e',
  unpublished: '#94a3b8',
  archived: '#64748b',
}

export function EditorTopbar({ brochure, companies, saveStatus, liveblocksEnabled, onTitleChange, onStatusChange, onFeatureChange, onOpenSettings }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [statusMenu, setStatusMenu] = useState(false)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'generating' | 'copied' | 'error'>('idle')
  const [htmlExportStatus, setHtmlExportStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // Close status menu on outside click / Escape.
  useEffect(() => {
    if (!statusMenu) return
    const onDoc = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusMenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [statusMenu])

  const companyDomain = useMemo(() => {
    const ref = brochure.company?._ref
    if (!ref) return null
    return companies.find((c) => c._id === ref)?.domain ?? null
  }, [brochure.company?._ref, companies])
  const host = brochureHost(companyDomain)
  const publicUrl = `https://${host}/${brochure.slug.current}`

  function handleStatus(next: BrochureStatus) {
    setStatusMenu(false)
    startTransition(async () => {
      const res = await setBrochureStatusAction(brochure._id, next, brochure.slug.current)
      if (res.ok) onStatusChange(next, res.rev)
    })
  }

  function handleFeature() {
    startTransition(async () => {
      const res = await setFeaturedBrochureAction(brochure._id)
      if (res.ok) onFeatureChange(true, res.rev)
    })
  }

  function handleDelete() {
    setStatusMenu(false)
    if (!confirm(`Permanently delete "${brochure.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteBrochureAction(brochure._id)
      if (res.ok) {
        router.push('/admin')
      } else {
        alert(`Delete failed: ${'error' in res ? res.error : 'Unknown error'}`)
      }
    })
  }

  async function handleExportHtml() {
    if (htmlExportStatus === 'generating') return
    setHtmlExportStatus('generating')
    try {
      let previewToken: string | null = null
      if (brochure.status !== 'published') {
        const res = await generatePreviewLinkAction(brochure._id)
        if (res.ok) {
          const m = res.url.match(/[?&]preview=([^&]+)/)
          if (m) previewToken = decodeURIComponent(m[1])
        }
      }

      const slug = brochure.slug?.current
      if (!slug) {
        setHtmlExportStatus('error')
        setTimeout(() => setHtmlExportStatus('idle'), 2000)
        return
      }
      const params = new URLSearchParams()
      if (previewToken) params.set('preview', previewToken)
      const exportUrl = `/api/export/${encodeURIComponent(slug)}/html${params.toString() ? `?${params}` : ''}`

      const res = await fetch(exportUrl, { method: 'GET' })
      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const diagnostic = await res.json().catch(() => null)
        console.group(`[HTML export] ${res.ok ? 'debug' : 'failed'} (${res.status})`)
        console.log(diagnostic)
        if (diagnostic?.sourceUrl) console.log('source url:', diagnostic.sourceUrl)
        if (diagnostic?.renderedError) console.error('rendered error:', diagnostic.renderedError)
        if (diagnostic?.pageErrors?.length) console.error('page errors:', diagnostic.pageErrors)
        if (diagnostic?.httpFailures?.length) console.error('http failures:', diagnostic.httpFailures)
        if (diagnostic?.logs?.length) console.log('browser logs:', diagnostic.logs)
        console.groupEnd()
        if (!res.ok) {
          setHtmlExportStatus('error')
          setTimeout(() => setHtmlExportStatus('idle'), 2000)
          alert('HTML export failed — see browser console for details.')
          return
        }
        setHtmlExportStatus('idle')
        return
      }

      if (!res.ok) {
        setHtmlExportStatus('error')
        setTimeout(() => setHtmlExportStatus('idle'), 2000)
        return
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${slug}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000)
      setHtmlExportStatus('idle')
    } catch (err) {
      console.error(err)
      setHtmlExportStatus('error')
      setTimeout(() => setHtmlExportStatus('idle'), 2000)
    }
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
      const fullUrl = `https://${host}${res.url}`
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
        <Link href="/admin" className="editor-icon-btn" aria-label="Back to library" title="Back to library">
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <input
          className="editor-topbar-title"
          value={brochure.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Brochure title"
        />
        <HostBadge host={host} slug={brochure.slug.current} isCompany={Boolean(companyDomain)} onClick={onOpenSettings} />
        <SaveIndicator status={saveStatus} />
        {liveblocksEnabled ? <PresenceAvatars /> : null}
      </div>

      <div className="editor-topbar-right">
        <button
          type="button"
          className={`editor-icon-btn ${brochure.featured ? 'active' : ''}`.trim()}
          onClick={handleFeature}
          disabled={pending || brochure.status !== 'published'}
          title={
            brochure.status !== 'published'
              ? 'Must be published to feature'
              : brochure.featured
                ? 'Featured — set as site root redirect'
                : 'Make this the site root redirect'
          }
          aria-label="Feature brochure"
          aria-pressed={brochure.featured}
        >
          <Star size={16} strokeWidth={2} fill={brochure.featured ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className="editor-icon-btn"
          onClick={onOpenSettings}
          title="Brochure settings (slug, SEO, lead capture…)"
          aria-label="Brochure settings"
        >
          <Settings size={16} strokeWidth={2} />
        </button>

        <button
          type="button"
          className={`editor-icon-btn ${previewStatus === 'copied' ? 'success' : previewStatus === 'error' ? 'error' : ''}`.trim()}
          onClick={handleCopyPreviewLink}
          disabled={previewStatus === 'generating'}
          title={
            previewStatus === 'copied'
              ? 'Preview link copied'
              : previewStatus === 'error'
                ? 'Failed to copy preview link'
                : 'Copy a signed preview URL (expires in 7 days)'
          }
          aria-label="Copy preview link"
        >
          {previewStatus === 'generating' ? (
            <Loader2 size={16} strokeWidth={2} className="editor-spin" />
          ) : previewStatus === 'copied' ? (
            <Check size={16} strokeWidth={2.4} />
          ) : previewStatus === 'error' ? (
            <AlertCircle size={16} strokeWidth={2} />
          ) : (
            <Link2 size={16} strokeWidth={2} />
          )}
        </button>

        <button
          type="button"
          className={`editor-icon-btn ${htmlExportStatus === 'error' ? 'error' : ''}`.trim()}
          onClick={handleExportHtml}
          disabled={htmlExportStatus === 'generating'}
          title={
            htmlExportStatus === 'generating'
              ? 'Generating HTML export…'
              : htmlExportStatus === 'error'
                ? 'HTML export failed'
                : 'Download a self-contained index.html that mirrors the live reader'
          }
          aria-label="Export HTML"
        >
          {htmlExportStatus === 'generating' ? (
            <Loader2 size={16} strokeWidth={2} className="editor-spin" />
          ) : htmlExportStatus === 'error' ? (
            <AlertCircle size={16} strokeWidth={2} />
          ) : (
            <Download size={16} strokeWidth={2} />
          )}
        </button>

        <span className="editor-topbar-divider" aria-hidden />

        <AdminThemeToggle />

        <span className="editor-topbar-divider" aria-hidden />

        {/* Status pill — clickable, opens menu with status options + delete */}
        <div className="editor-topbar-menu-wrap" ref={statusMenuRef}>
          <button
            type="button"
            className="editor-status-pill"
            onClick={() => setStatusMenu((v) => !v)}
            disabled={pending}
            aria-haspopup="menu"
            aria-expanded={statusMenu}
            title="Change status"
          >
            <span className="editor-status-pill-dot" style={{ background: STATUS_DOT[brochure.status] }} />
            <span>{STATUS_LABEL[brochure.status]}</span>
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>
          {statusMenu ? (
            <div className="editor-topbar-menu" role="menu">
              {(['draft', 'published', 'unpublished', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  role="menuitem"
                  onClick={() => handleStatus(s)}
                  className={brochure.status === s ? 'active' : ''}
                >
                  <span className="editor-status-pill-dot" style={{ background: STATUS_DOT[s] }} />
                  <span>{STATUS_LABEL[s]}</span>
                </button>
              ))}
              <div className="editor-topbar-menu-divider" />
              <button role="menuitem" onClick={handleDelete} className="danger">
                <Trash2 size={14} strokeWidth={2} />
                <span>Delete permanently</span>
              </button>
            </div>
          ) : null}
        </div>

        {brochure.status === 'published' ? (
          <a
            className="editor-topbar-btn primary"
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            title={`Open ${host}/${brochure.slug.current}`}
          >
            <ExternalLink size={14} strokeWidth={2.2} />
            <span>Live</span>
          </a>
        ) : null}
      </div>
    </header>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const config = {
    saved:    { Icon: CloudCheck,  label: 'Saved',       title: 'All changes saved' },
    saving:   { Icon: CloudUpload, label: 'Saving',      title: 'Saving changes…' },
    unsaved:  { Icon: CircleDot,   label: 'Unsaved',     title: 'Unsaved changes' },
    error:    { Icon: CloudOff,    label: 'Save failed', title: 'Save failed — retrying' },
    conflict: { Icon: AlertCircle, label: 'Conflict',    title: 'Another admin edited this brochure — reload to continue' },
  }[status]
  return (
    <div className={`editor-save-indicator status-${status}`} title={config.title} aria-live="polite">
      <config.Icon
        size={14}
        strokeWidth={2}
        className={status === 'saving' ? 'editor-spin-slow' : ''}
        aria-hidden
      />
      <span>{config.label}</span>
    </div>
  )
}

function HostBadge({
  host,
  slug,
  isCompany,
  onClick,
}: {
  host: string
  slug: string
  isCompany: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="editor-host-badge"
      onClick={onClick}
      title={`Served at ${host}/${slug} — click to change host in Settings`}
    >
      <Globe size={13} strokeWidth={2} aria-hidden />
      <span className="editor-host-badge-host">{host}</span>
      <span className="editor-host-badge-sep">/</span>
      <span className="editor-host-badge-slug">{slug}</span>
      {isCompany ? <span className="editor-host-badge-tag">company</span> : null}
    </button>
  )
}
