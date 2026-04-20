'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateBrochureAction, seedLibraryImagesAction } from '@/lib/sanity/actions'

type Props = {
  open: boolean
  onClose: () => void
}

type Status =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'error'; message: string }
  | {
      kind: 'success'
      id: string
      slug: string
      usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number }
    }

/**
 * "Generate with AI" modal — takes an event, season, and up to 4 source URLs,
 * hands them to Claude, and redirects to the editor on success. Also exposes
 * a one-shot "Seed image library" button for the first-time setup.
 */
export function AiGenerateModal({ open, onClose }: Props) {
  const router = useRouter()
  const [event, setEvent] = useState('')
  const [season, setSeason] = useState('2026')
  const [urls, setUrls] = useState<string[]>([''])
  const [vibe, setVibe] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [seedStatus, setSeedStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [seedPending, startSeedTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setEvent('')
      setSeason('2026')
      setUrls([''])
      setVibe('')
      setAdminNotes('')
      setStatus({ kind: 'idle' })
      setSeedStatus(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending && !seedPending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, pending, seedPending])

  if (!open) return null

  function handleGenerate() {
    const trimmedUrls = urls.map((u) => u.trim()).filter(Boolean)
    if (!event.trim()) {
      setStatus({ kind: 'error', message: 'Event name is required.' })
      return
    }
    setStatus({ kind: 'generating' })
    startTransition(async () => {
      const res = await generateBrochureAction({
        event: event.trim(),
        season: season.trim(),
        urls: trimmedUrls,
        vibe: vibe.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      })
      if (res.ok) {
        setStatus({ kind: 'success', id: res.id, slug: res.slug, usage: res.usage })
        // Small delay so the user sees the success state before the jump.
        setTimeout(() => router.push(`/admin/brochures/${res.id}/edit`), 600)
      } else {
        setStatus({ kind: 'error', message: res.error })
      }
    })
  }

  function handleSeed() {
    setSeedStatus('Seeding library…')
    startSeedTransition(async () => {
      const res = await seedLibraryImagesAction()
      if (res.error) {
        setSeedStatus(`Error: ${res.error}`)
        return
      }
      setSeedStatus(
        `Uploaded ${res.uploaded.length}, already present ${res.alreadyPresent.length}, skipped ${res.skipped.length}.`
      )
    })
  }

  return (
    <div
      className="add-section-overlay"
      onClick={pending || seedPending ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Generate with AI"
    >
      <div className="add-section-modal new-brochure-modal ai-generate-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">AI Builder · Claude</div>
            <h2 className="add-section-modal-title">Generate a brochure</h2>
          </div>
          <button
            type="button"
            className="add-section-close"
            onClick={onClose}
            disabled={pending || seedPending}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="new-brochure-body">
          <div className="field-group">
            <label className="field-label">Event</label>
            <input
              className="field-input"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. Spanish Grand Prix"
              disabled={pending}
              autoFocus
            />
          </div>

          <div className="new-brochure-row">
            <div className="field-group">
              <label className="field-label">Season</label>
              <select
                className="field-input field-select"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                disabled={pending}
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Vibe (optional)</label>
              <input
                className="field-input"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. editorial, high-energy, heritage"
                disabled={pending}
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Source URLs</label>
            <div className="field-description">
              Up to 4 links Claude should read for facts (prices, dates, package names, circuit info).
              Leave blank to use general knowledge only.
            </div>
            {urls.map((u, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input
                  className="field-input"
                  value={u}
                  onChange={(e) => {
                    const next = [...urls]
                    next[i] = e.target.value
                    setUrls(next)
                  }}
                  placeholder="https://www.grandprixgrandtours.com/…"
                  disabled={pending}
                />
                {urls.length > 1 ? (
                  <button
                    type="button"
                    className="editor-topbar-btn"
                    onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                    disabled={pending}
                    style={{ flexShrink: 0 }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {urls.length < 4 ? (
              <button
                type="button"
                className="editor-topbar-btn"
                onClick={() => setUrls([...urls, ''])}
                disabled={pending}
                style={{ marginTop: 2 }}
              >
                + Add URL
              </button>
            ) : null}
          </div>

          <div className="field-group">
            <label className="field-label">Admin notes (optional)</label>
            <textarea
              className="field-input"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Anything Claude should know — a hook, a specific package to highlight, a page to skip…"
              rows={3}
              disabled={pending}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>Image library</div>
                <div>Seeds /public/textures/images/* to Sanity. Safe to re-run.</div>
              </div>
              <button
                type="button"
                className="editor-topbar-btn"
                onClick={handleSeed}
                disabled={seedPending || pending}
              >
                {seedPending ? 'Seeding…' : 'Seed library'}
              </button>
            </div>
            {seedStatus ? (
              <div style={{ marginTop: 8, fontFamily: 'ui-monospace, monospace', fontSize: 11, opacity: 0.75 }}>
                {seedStatus}
              </div>
            ) : null}
          </div>

          {status.kind === 'error' ? <div className="field-error">{status.message}</div> : null}
          {status.kind === 'generating' ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'rgba(225,6,0,0.08)',
                border: '1px solid rgba(225,6,0,0.35)',
                borderRadius: 4,
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              <div style={{ marginBottom: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Generating…
              </div>
              <div style={{ opacity: 0.7 }}>Fetching sources, thinking, writing to Sanity. 15–45 seconds typical.</div>
            </div>
          ) : null}
          {status.kind === 'success' ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 4,
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              <div style={{ marginBottom: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Done — opening editor
              </div>
              <div style={{ opacity: 0.7 }}>
                in {status.usage.inputTokens}, out {status.usage.outputTokens}, cached{' '}
                {status.usage.cacheReadTokens}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="new-brochure-footer">
          <button className="editor-topbar-btn" onClick={onClose} disabled={pending || seedPending}>
            Cancel
          </button>
          <button
            className="editor-topbar-btn primary"
            onClick={handleGenerate}
            disabled={pending || seedPending || status.kind === 'success'}
          >
            {pending ? 'Generating…' : status.kind === 'success' ? 'Opening…' : 'Generate & open'}
          </button>
        </footer>
      </div>
    </div>
  )
}
