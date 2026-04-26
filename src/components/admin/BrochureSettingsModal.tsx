'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Brochure, SanityImage } from '@/types/brochure'
import { updateBrochureSettingsAction } from '@/lib/sanity/actions'
import { FieldInput } from './fields/FieldInput'
import { FieldTextarea } from './fields/FieldTextarea'
import { FieldBoolean } from './fields/FieldBoolean'
import { FieldSelect } from './fields/FieldSelect'
import { FieldColor } from './fields/FieldColor'
import { FieldImage } from './fields/FieldImage'

type Props = {
  open: boolean
  brochure: Brochure
  onClose: () => void
  onSaved: (updates: {
    slug: { _type: 'slug'; current: string }
    season: string
    event: string
    seo: NonNullable<Brochure['seo']>
    leadCapture: NonNullable<Brochure['leadCapture']>
    accentColor: string | undefined
    logo: SanityImage | undefined
  }) => void
}

/**
 * Brochure-level settings modal — opened from the editor topbar.
 * Covers fields that aren't part of the autosave write path: slug, season,
 * event, SEO, and lead capture. Commits via updateBrochureSettingsAction
 * which runs a slug uniqueness check server-side.
 */
export function BrochureSettingsModal({ open, brochure, onClose, onSaved }: Props) {
  const [slug, setSlug] = useState(brochure.slug.current)
  const [season, setSeason] = useState(brochure.season)
  const [event, setEvent] = useState(brochure.event ?? '')
  const [metaTitle, setMetaTitle] = useState(brochure.seo?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(brochure.seo?.metaDescription ?? '')
  const [noIndex, setNoIndex] = useState(Boolean(brochure.seo?.noIndex))
  const [hubspotPortalId, setHubspotPortalId] = useState(brochure.leadCapture?.hubspotPortalId ?? '')
  const [hubspotFormId, setHubspotFormId] = useState(brochure.leadCapture?.hubspotFormId ?? '')
  const [destinationEmail, setDestinationEmail] = useState(brochure.leadCapture?.destinationEmail ?? '')
  const [accentColor, setAccentColor] = useState<string | undefined>(brochure.accentColor)
  const [logo, setLogo] = useState<SanityImage | undefined>(brochure.logo)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Re-seed local state whenever the modal is opened or the underlying
  // brochure changes — prevents showing stale fields if the admin reopens.
  useEffect(() => {
    if (!open) return
    setSlug(brochure.slug.current)
    setSeason(brochure.season)
    setEvent(brochure.event ?? '')
    setMetaTitle(brochure.seo?.metaTitle ?? '')
    setMetaDescription(brochure.seo?.metaDescription ?? '')
    setNoIndex(Boolean(brochure.seo?.noIndex))
    setHubspotPortalId(brochure.leadCapture?.hubspotPortalId ?? '')
    setHubspotFormId(brochure.leadCapture?.hubspotFormId ?? '')
    setDestinationEmail(brochure.leadCapture?.destinationEmail ?? '')
    setAccentColor(brochure.accentColor)
    setLogo(brochure.logo)
    setError(null)
  }, [open, brochure])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, pending])

  if (!open) return null

  const slugChanged = slug.trim() !== brochure.slug.current

  function handleSave() {
    const normalisedSlug = slug.trim().toLowerCase()
    if (!normalisedSlug) {
      setError('Slug is required.')
      return
    }
    if (!/^[a-z0-9-]+$/.test(normalisedSlug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }
    if (!event.trim()) {
      setError('Event is required.')
      return
    }
    setError(null)

    const seo = {
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      noIndex: noIndex || undefined,
    }
    const leadCapture = {
      hubspotPortalId: hubspotPortalId.trim() || undefined,
      hubspotFormId: hubspotFormId.trim() || undefined,
      destinationEmail: destinationEmail.trim() || undefined,
    }

    startTransition(async () => {
      const res = await updateBrochureSettingsAction(
        brochure._id,
        {
          slug: normalisedSlug,
          season: season.trim(),
          event: event.trim(),
          seo,
          leadCapture,
          accentColor: accentColor ?? null,
          logo: logo ?? null,
        },
        brochure.slug.current
      )
      if (!res.ok) {
        setError(res.error)
        return
      }
      onSaved({
        slug: { _type: 'slug', current: normalisedSlug },
        season: season.trim(),
        event: event.trim(),
        seo,
        leadCapture,
        accentColor,
        logo,
      })
      onClose()
    })
  }

  return (
    <div
      className="add-section-overlay"
      onClick={pending ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Brochure settings"
    >
      <div
        className="add-section-modal new-brochure-modal brochure-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">Brochure</div>
            <h2 className="add-section-modal-title">Settings</h2>
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

        <div className="new-brochure-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <SectionHeader label="Core" />

          <FieldInput
            label="Event"
            description="The grand prix or race name, e.g. Italian Grand Prix."
            value={event}
            onChange={setEvent}
            placeholder="Italian Grand Prix"
          />

          <FieldSelect
            label="Season"
            description="The calendar year the event falls in."
            value={season}
            onChange={setSeason}
            options={[
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
              { value: '2028', label: '2028' },
            ]}
          />

          <FieldInput
            label="URL slug"
            description={
              slugChanged
                ? '⚠ Changing the slug breaks any existing public URLs that used the old one. Make sure no live links depend on it.'
                : 'Public URL path. Lowercase letters, numbers, and hyphens only.'
            }
            value={slug}
            onChange={(v) => setSlug(v.toLowerCase())}
            placeholder="italian-grand-prix"
          />

          <SectionHeader label="Branding" />

          <FieldColor
            label="Accent colour"
            description="Overrides the platform brand red across this brochure (buttons, eyebrows, accent rules, decorative SVG washes). Leave default for #e10600."
            value={accentColor}
            onChange={setAccentColor}
          />

          <FieldImage
            label="Logo"
            description="Replaces the GPGT logo in the brochure nav. Leave blank to use the default."
            value={logo}
            onChange={setLogo}
            previewWidth={400}
          />

          <SectionHeader label="SEO" />

          <FieldInput
            label="Meta title"
            description="Shown in search results and browser tabs. Falls back to the brochure title."
            value={metaTitle}
            onChange={setMetaTitle}
            placeholder={brochure.title}
            maxLength={70}
          />

          <FieldTextarea
            label="Meta description"
            description="1–2 sentence summary for search results. Keep under 160 characters."
            value={metaDescription}
            onChange={setMetaDescription}
            placeholder="Fully inclusive packages for the 2026 Italian Grand Prix…"
            rows={3}
          />

          <FieldBoolean
            label="Hide from search engines (noindex)"
            description="Useful for private or draft brochures that are published but shouldn't appear on Google."
            value={noIndex}
            onChange={setNoIndex}
          />

          <SectionHeader label="Lead capture" />

          <FieldInput
            label="HubSpot portal ID"
            description="Defaults to HUBSPOT_PORTAL_ID env var if left blank."
            value={hubspotPortalId}
            onChange={setHubspotPortalId}
            placeholder="123456"
          />

          <FieldInput
            label="HubSpot form ID"
            description="The form that receives enquiries from this brochure."
            value={hubspotFormId}
            onChange={setHubspotFormId}
            placeholder="abc-123-def-456"
          />

          <FieldInput
            label="Destination email"
            description="Internal recipient for new-enquiry notifications (via Resend)."
            value={destinationEmail}
            onChange={setDestinationEmail}
            placeholder="sales@grandprixgrandtours.com"
          />

          {error ? <div className="field-error" style={{ marginTop: 12 }}>{error}</div> : null}
        </div>

        <footer className="new-brochure-footer">
          <button className="editor-topbar-btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="editor-topbar-btn primary" onClick={handleSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </button>
        </footer>
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 4,
        paddingBottom: 6,
        borderBottom: '1px solid var(--chrome-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--chrome-text-secondary)',
      }}
    >
      {label}
    </div>
  )
}
