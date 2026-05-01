'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateBrochureAction } from '@/lib/sanity/actions'
import { FieldDictateTextarea } from './fields/FieldDictateTextarea'

type CompanyOption = { _id: string; name: string; domain: string }

type Props = {
  open: boolean
  onClose: () => void
  /** Available host companies for the picker. */
  companies?: CompanyOption[]
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

const BRIEF_PLACEHOLDER = `e.g. 4-day luxury hospitality experience for the Spanish Grand Prix at Circuit de Barcelona-Catalunya. Audience: high-net-worth couples. Tone: editorial, restrained, place-literate. Must include grandstand and VIP package tiers, a host-city focus on Barcelona's design district, and a closing CTA.`

/**
 * "Generate with AI" modal — captures a free-form brief plus optional
 * reference URLs and hands them to Claude. The brief drives page structure;
 * Claude decides section types and copy. Redirects to the editor on success.
 */
export function AiGenerateModal({ open, onClose, companies = [] }: Props) {
  const router = useRouter()
  const [event, setEvent] = useState('')
  const [season, setSeason] = useState('2026')
  const [brief, setBrief] = useState('')
  const [urls, setUrls] = useState<string[]>([''])
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setEvent('')
      setSeason('2026')
      setBrief('')
      setUrls([''])
      setCompanyId('')
      setStatus({ kind: 'idle' })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, pending])

  if (!open) return null

  function handleGenerate() {
    const trimmedUrls = urls.map((u) => u.trim()).filter(Boolean)
    const trimmedBrief = brief.trim()
    if (!event.trim()) {
      setStatus({ kind: 'error', message: 'Event name is required.' })
      return
    }
    if (!trimmedBrief) {
      setStatus({ kind: 'error', message: 'Brief is required — tell Claude what to build.' })
      return
    }
    setStatus({ kind: 'generating' })
    startTransition(async () => {
      const res = await generateBrochureAction({
        event: event.trim(),
        season: season.trim(),
        brief: {
          prompt: trimmedBrief,
          sources: trimmedUrls.length ? trimmedUrls : undefined,
        },
        companyId: companyId || undefined,
      })
      if (res.ok) {
        setStatus({ kind: 'success', id: res.id, slug: res.slug, usage: res.usage })
        setTimeout(() => router.push(`/admin/brochures/${res.id}/edit`), 600)
      } else {
        setStatus({ kind: 'error', message: res.error })
      }
    })
  }

  return (
    <div
      className="add-section-overlay"
      onClick={pending ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Generate with AI"
    >
      <div className="add-section-modal new-brochure-modal ai-generate-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">AI Builder · Claude Opus 4.7</div>
            <h2 className="add-section-modal-title">Generate a brochure</h2>
          </div>
          <button
            type="button"
            className="add-section-close"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="new-brochure-body">
          <div className="new-brochure-row">
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
          </div>

          <FieldDictateTextarea
            label="Brief"
            description="What this brochure is for, who it's for, the tone, the must-haves. Claude decides the page structure from this — be specific. Click Dictate to speak it instead of typing."
            value={brief}
            onChange={setBrief}
            placeholder={BRIEF_PLACEHOLDER}
            rows={8}
            disabled={pending}
          />

          <div className="field-group">
            <label className="field-label">Reference URLs (optional)</label>
            <div className="field-description">
              Up to 5 links. Claude can also web-search on its own, so this is just a head-start.
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
                  placeholder="https://www.formula1.com/…"
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
            {urls.length < 5 ? (
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

          {companies.length > 0 ? (
            <div className="field-group">
              <label className="field-label">Host company</label>
              <div className="field-description">
                Determines which domain serves this brochure. Leave on{' '}
                <em>Grand Prix Grand Tours</em> to host on the main GPGT domain.
              </div>
              <select
                className="field-input field-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={pending}
              >
                <option value="">Grand Prix Grand Tours (brochures.grandprixgrandtours.com)</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.domain}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {status.kind === 'error' ? <div className="field-error">{status.message}</div> : null}
          {status.kind === 'generating' ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'rgba(0, 71, 225, 0.08)',
                border: '1px solid rgba(0, 60, 225, 0.35)',
                borderRadius: 4,
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              <div style={{ marginBottom: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Generating…
              </div>
              <div style={{ opacity: 0.7 }}>
                Researching, thinking, writing. 30–90 seconds typical with web search.
              </div>
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
          <button className="editor-topbar-btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            className="editor-topbar-btn primary"
            onClick={handleGenerate}
            disabled={pending || status.kind === 'success'}
          >
            {pending ? 'Generating…' : status.kind === 'success' ? 'Opening…' : 'Generate & open'}
          </button>
        </footer>
      </div>
    </div>
  )
}
