'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Brochure, CustomColor, CustomFont, CustomFontWeight, FontOverrides, SanityImage, TextScalePreset } from '@/types/brochure'
import { updateBrochureSettingsAction } from '@/lib/sanity/actions'
import { nanokey } from '@/lib/nanokey'
import {
  customFontSlug,
  fontOptionsForRole,
  weightOptionsForRole,
  fontFamilyForSlug,
  googleFontsUrlForSlug,
  customFontFaceCss,
} from '@/lib/fontPalette'
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
    backgroundColor: string | undefined
    textColor: string | undefined
    titleColor: string | undefined
    bodyColor: string | undefined
    eyebrowItalic: boolean | undefined
    eyebrowTransform: string | undefined
    fontOverrides: FontOverrides | undefined
    customFonts: CustomFont[] | undefined
    titleScale: TextScalePreset | undefined
    eyebrowScale: TextScalePreset | undefined
    taglineScale: TextScalePreset | undefined
    customColors: CustomColor[] | undefined
    navColor: string | undefined
    textureImage: SanityImage | undefined
    hideTexture: boolean
    logo: SanityImage | undefined
  }) => void
}

type SettingsTab = 'general' | 'branding' | 'typography' | 'seo' | 'lead'

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'typography', label: 'Typography' },
  { key: 'seo', label: 'SEO' },
  { key: 'lead', label: 'Lead capture' },
]

/**
 * Brochure-level settings modal — opened from the editor topbar.
 *
 * Organised into five vertical tabs:
 *   General    — event, season, slug
 *   Branding   — colours, logo, custom colours, background texture
 *   Typography — text sizes, font families + weights
 *   SEO        — meta title, meta description, noIndex
 *   Lead       — HubSpot portal/form, destination email
 */
export function BrochureSettingsModal({ open, brochure, onClose, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
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
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(brochure.backgroundColor)
  const [textColor, setTextColor] = useState<string | undefined>(brochure.textColor)
  const [titleColor, setTitleColor] = useState<string | undefined>(brochure.titleColor)
  const [bodyColor, setBodyColor] = useState<string | undefined>(brochure.bodyColor)
  const [eyebrowItalic, setEyebrowItalic] = useState<boolean | undefined>(brochure.eyebrowItalic)
  const [eyebrowTransform, setEyebrowTransform] = useState<string | undefined>(brochure.eyebrowTransform)
  const [fontDisplay, setFontDisplay] = useState<string | undefined>(brochure.fontOverrides?.display)
  const [fontDisplayWeight, setFontDisplayWeight] = useState<string | undefined>(brochure.fontOverrides?.displayWeight)
  const [fontScript, setFontScript] = useState<string | undefined>(brochure.fontOverrides?.script)
  const [fontScriptWeight, setFontScriptWeight] = useState<string | undefined>(brochure.fontOverrides?.scriptWeight)
  const [fontBody, setFontBody] = useState<string | undefined>(brochure.fontOverrides?.body)
  const [fontBodyWeight, setFontBodyWeight] = useState<string | undefined>(brochure.fontOverrides?.bodyWeight)
  const [fontMono, setFontMono] = useState<string | undefined>(brochure.fontOverrides?.mono)
  const [fontMonoWeight, setFontMonoWeight] = useState<string | undefined>(brochure.fontOverrides?.monoWeight)
  const [customFonts, setCustomFonts] = useState<CustomFont[] | undefined>(
    Array.isArray(brochure.customFonts) ? brochure.customFonts : undefined
  )
  const [titleScale, setTitleScale] = useState<TextScalePreset | undefined>(brochure.titleScale)
  const [eyebrowScale, setEyebrowScale] = useState<TextScalePreset | undefined>(brochure.eyebrowScale)
  const [taglineScale, setTaglineScale] = useState<TextScalePreset | undefined>(brochure.taglineScale)
  const [customColors, setCustomColors] = useState<CustomColor[]>(brochure.customColors ?? [])
  const [navColor, setNavColor] = useState<string | undefined>(brochure.navColor)
  const [textureImage, setTextureImage] = useState<SanityImage | undefined>(brochure.textureImage)
  const [hideTexture, setHideTexture] = useState(Boolean(brochure.hideTexture))
  const [logo, setLogo] = useState<SanityImage | undefined>(brochure.logo)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Re-seed local state whenever the modal is opened or the underlying
  // brochure changes — prevents showing stale fields if the admin reopens.
  useEffect(() => {
    if (!open) return
    setActiveTab('general')
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
    setBackgroundColor(brochure.backgroundColor)
    setTextColor(brochure.textColor)
    setTitleColor(brochure.titleColor)
    setBodyColor(brochure.bodyColor)
    setEyebrowItalic(brochure.eyebrowItalic)
    setEyebrowTransform(brochure.eyebrowTransform)
    setFontDisplay(brochure.fontOverrides?.display)
    setFontDisplayWeight(brochure.fontOverrides?.displayWeight)
    setFontScript(brochure.fontOverrides?.script)
    setFontScriptWeight(brochure.fontOverrides?.scriptWeight)
    setFontBody(brochure.fontOverrides?.body)
    setFontBodyWeight(brochure.fontOverrides?.bodyWeight)
    setFontMono(brochure.fontOverrides?.mono)
    setFontMonoWeight(brochure.fontOverrides?.monoWeight)
    setCustomFonts(Array.isArray(brochure.customFonts) ? brochure.customFonts : undefined)
    setTitleScale(brochure.titleScale)
    setEyebrowScale(brochure.eyebrowScale)
    setTaglineScale(brochure.taglineScale)
    setCustomColors(brochure.customColors ?? [])
    setNavColor(brochure.navColor)
    setTextureImage(brochure.textureImage)
    setHideTexture(Boolean(brochure.hideTexture))
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

  // Inject @font-face rules for custom fonts into <head>.
  // Data URIs are stored directly on the font weights — no network requests needed.
  useEffect(() => {
    const css = customFonts?.length ? customFontFaceCss(customFonts) : null
    if (!css) return
    const style = document.createElement('style')
    style.setAttribute('data-custom-fonts', 'true')
    style.textContent = css
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [customFonts])

  if (!open) return null

  const slugChanged = slug.trim() !== brochure.slug.current

  function handleSave() {
    const normalisedSlug = slug.trim().toLowerCase()
    if (!normalisedSlug) {
      setActiveTab('general')
      setError('Slug is required.')
      return
    }
    if (!/^[a-z0-9-]+$/.test(normalisedSlug)) {
      setActiveTab('general')
      setError('Slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }
    if (!event.trim()) {
      setActiveTab('general')
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
          backgroundColor: backgroundColor ?? null,
          textColor: textColor ?? null,
          titleColor: titleColor ?? null,
          bodyColor: bodyColor ?? null,
          eyebrowItalic: eyebrowItalic ?? null,
          eyebrowTransform: eyebrowTransform ?? null,
          fontOverrides: (fontDisplay || fontDisplayWeight || fontScript || fontScriptWeight || fontBody || fontBodyWeight || fontMono || fontMonoWeight)
            ? {
                display: fontDisplay || undefined,
                displayWeight: fontDisplayWeight || undefined,
                script: fontScript || undefined,
                scriptWeight: fontScriptWeight || undefined,
                body: fontBody || undefined,
                bodyWeight: fontBodyWeight || undefined,
                mono: fontMono || undefined,
                monoWeight: fontMonoWeight || undefined,
              }
            : null,
          customFonts: customFonts?.length ? customFonts : null,
          titleScale: titleScale ?? null,
          eyebrowScale: eyebrowScale ?? null,
          taglineScale: taglineScale ?? null,
          customColors: customColors.length > 0 ? customColors : null,
          navColor: navColor ?? null,
          textureImage: textureImage ?? null,
          hideTexture: hideTexture || null,
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
        backgroundColor,
        textColor,
        titleColor,
        bodyColor,
        eyebrowItalic,
        eyebrowTransform,
        fontOverrides: (fontDisplay || fontDisplayWeight || fontScript || fontScriptWeight || fontBody || fontBodyWeight || fontMono || fontMonoWeight)
          ? { display: fontDisplay, displayWeight: fontDisplayWeight, script: fontScript, scriptWeight: fontScriptWeight, body: fontBody, bodyWeight: fontBodyWeight, mono: fontMono, monoWeight: fontMonoWeight }
          : undefined,
        customFonts: customFonts?.length ? customFonts : undefined,
        titleScale,
        eyebrowScale,
        taglineScale,
        customColors: customColors.length > 0 ? customColors : undefined,
        navColor,
        textureImage,
        hideTexture,
        logo,
      })
      onClose()
    })
  }

  // ───────── Scale preset options (shared) ─────────
  const scaleOptions = [
    { value: 'xs', label: 'XS — Compact' },
    { value: 's', label: 'S — Small' },
    { value: 'm', label: 'M — Default' },
    { value: 'l', label: 'L — Large' },
    { value: 'xl', label: 'XL — Extra Large' },
  ]

  return (
    <>
    <FontPreviewLinks slugs={[fontDisplay, fontScript, fontBody, fontMono]} />
    <div
      className="add-section-overlay"
      onClick={pending ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Brochure settings"
    >
      <div
        className="add-section-modal brochure-settings-modal"
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

        <div className="settings-layout">
          {/* ───── Sidebar tabs ───── */}
          <nav className="settings-sidebar" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`settings-sidebar-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* ───── Tab panel ───── */}
          <div className="settings-panel" role="tabpanel">
            {activeTab === 'general' && (
              <>
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
              </>
            )}

            {activeTab === 'branding' && (
              <>
                <SectionHeader label="Colours" />
                <div className="settings-subgroup-label">Brand colours</div>
                <div className="brand-colors-compact">
                  <FieldColor
                    label="Accent"
                    value={accentColor}
                    onChange={setAccentColor}
                  />
                  <FieldColor
                    label="Title"
                    value={titleColor}
                    onChange={setTitleColor}
                    fallback={brochure.theme === 'light' ? '#161618' : '#ffffff'}
                  />
                  <FieldColor
                    label="Text"
                    value={textColor}
                    onChange={setTextColor}
                    fallback={brochure.theme === 'light' ? '#161618' : '#ffffff'}
                  />
                  <FieldColor
                    label="Background"
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    fallback={brochure.theme === 'light' ? '#f6f5f1' : '#161618'}
                  />
                  <FieldColor
                    label="Navigation"
                    value={navColor}
                    onChange={setNavColor}
                    fallback="#161618"
                  />
                </div>

                <div className="settings-subgroup-label">Custom colours</div>
                <div className="custom-colors-list">
                  {customColors.map((c) => (
                    <div key={c._key} className="custom-color-card">
                      <label
                        className="custom-color-swatch"
                        style={{ background: c.hex || '#888' }}
                      >
                        <input
                          type="color"
                          value={c.hex || '#e10600'}
                          onChange={(e) => setCustomColors((prev) => prev.map((p) => p._key === c._key ? { ...p, hex: e.target.value } : p))}
                          aria-label={`${c.name || 'Custom'} colour picker`}
                        />
                      </label>
                      <div className="custom-color-fields">
                        <input
                          type="text"
                          className="field-input custom-color-name"
                          value={c.name}
                          onChange={(e) => setCustomColors((prev) => prev.map((p) => p._key === c._key ? { ...p, name: e.target.value } : p))}
                          placeholder="Colour name"
                        />
                        <input
                          type="text"
                          className="field-input custom-color-hex"
                          value={c.hex}
                          onChange={(e) => {
                            const v = e.target.value.trim()
                            setCustomColors((prev) => prev.map((p) => p._key === c._key ? { ...p, hex: v } : p))
                          }}
                          placeholder="#e10600"
                          spellCheck={false}
                          maxLength={7}
                        />
                      </div>
                      <button
                        type="button"
                        className="custom-color-remove"
                        onClick={() => setCustomColors((prev) => prev.filter((p) => p._key !== c._key))}
                        aria-label={`Remove ${c.name || 'colour'}`}
                        title="Remove"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="field-btn"
                  onClick={() => setCustomColors((prev) => [...prev, { _key: nanokey(), name: '', hex: '#e10600' }])}
                >
                  + Add colour
                </button>

                <SectionHeader label="Logo" />
                <div className="logo-image-field">
                  <FieldImage
                    label="Logo"
                    description="Replaces the GPGT logo in the brochure nav. Leave blank to use the default."
                    value={logo}
                    onChange={setLogo}
                    previewWidth={400}
                    defaultPreview="/textures/Grand_Prix_Logo_Vector_Editable 5.png"
                  />
                </div>

                <SectionHeader label="Background" />
                {hideTexture ? (
                  <div className="texture-hidden-card">
                    <div className="texture-hidden-label">No background texture</div>
                    <button
                      type="button"
                      className="field-btn"
                      onClick={() => setHideTexture(false)}
                    >
                      Restore default
                    </button>
                  </div>
                ) : (
                  <div className="logo-image-field">
                    <FieldImage
                      label="Background texture"
                      description="Replaces the default halftone texture across all textured sections."
                      value={textureImage}
                      onChange={setTextureImage}
                      defaultPreview="/textures/halftone.png"
                    />
                    {!textureImage ? (
                      <button
                        type="button"
                        className="field-btn field-btn-ghost texture-hide-btn"
                        onClick={() => setHideTexture(true)}
                      >
                        Hide texture
                      </button>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {activeTab === 'typography' && (
              <>
                <SectionHeader label="Type scale" />
                <FieldSelect
                  label="Title"
                  description="Scale factor for headline and title text across the brochure."
                  value={titleScale ?? 'm'}
                  onChange={(v) => setTitleScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={scaleOptions}
                />
                <FieldSelect
                  label="Eyebrow"
                  description="Scale factor for eyebrow text across the brochure."
                  value={eyebrowScale ?? 'm'}
                  onChange={(v) => setEyebrowScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={scaleOptions}
                />
                <FieldSelect
                  label="Body text"
                  description="Scale factor for body, tagline, and subtitle text across the brochure."
                  value={taglineScale ?? 'm'}
                  onChange={(v) => setTaglineScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={scaleOptions}
                />

                <SectionHeader label="Fonts" />
                <FontCard
                  role="display"
                  label="Title"
                  description="Headlines and display text"
                  previewText="Monaco Grand Prix"
                  previewSize={28}
                  fontSlug={fontDisplay}
                  fontWeight={fontDisplayWeight}
                  customFonts={customFonts}
                  onFontChange={(v) => { setFontDisplay(v || undefined); setFontDisplayWeight(undefined) }}
                  onWeightChange={(v) => setFontDisplayWeight(v || undefined)}
                />
                <FontCard
                  role="script"
                  label="Eyebrow"
                  description="Eyebrow and accent text"
                  previewText="A weekend of speed"
                  previewSize={26}
                  previewItalic={eyebrowItalic ?? true}
                  previewUppercase={eyebrowTransform === 'uppercase'}
                  previewTransform={eyebrowTransform}
                  fontSlug={fontScript}
                  fontWeight={fontScriptWeight}
                  customFonts={customFonts}
                  onFontChange={(v) => { setFontScript(v || undefined); setFontScriptWeight(undefined) }}
                  onWeightChange={(v) => setFontScriptWeight(v || undefined)}
                  extraControls={
                    <>
                      <FieldSelect
                        label="Style"
                        value={eyebrowItalic === false ? 'upright' : 'italic'}
                        onChange={(v) => setEyebrowItalic(v === 'upright' ? false : undefined)}
                        options={[
                          { value: 'italic', label: 'Italic' },
                          { value: 'upright', label: 'Upright' },
                        ]}
                      />
                      <FieldSelect
                        label="Letter case"
                        value={eyebrowTransform ?? ''}
                        onChange={(v) => setEyebrowTransform(v || undefined)}
                        options={[
                          { value: '', label: 'As typed' },
                          { value: 'uppercase', label: 'UPPERCASE' },
                          { value: 'lowercase', label: 'lowercase' },
                          { value: 'capitalize', label: 'Capitalize' },
                        ]}
                      />
                    </>
                  }
                />
                <FontCard
                  role="body"
                  label="Body"
                  description="Paragraph and body text"
                  previewText="Every trip is built around one idea: giving you a front-row seat to the world's most prestigious motorsport."
                  previewSize={14}
                  fontSlug={fontBody}
                  fontWeight={fontBodyWeight}
                  customFonts={customFonts}
                  onFontChange={(v) => { setFontBody(v || undefined); setFontBodyWeight(undefined) }}
                  onWeightChange={(v) => setFontBodyWeight(v || undefined)}
                />
                <FontCard
                  role="mono"
                  label="Label"
                  description="Labels, meta text, and data"
                  previewText="3.337 KM · 78 LAPS · 19 CORNERS"
                  previewSize={11}
                  previewUppercase
                  fontSlug={fontMono}
                  fontWeight={fontMonoWeight}
                  customFonts={customFonts}
                  onFontChange={(v) => { setFontMono(v || undefined); setFontMonoWeight(undefined) }}
                  onWeightChange={(v) => setFontMonoWeight(v || undefined)}
                />

                <SectionHeader label="Custom fonts" />
                <CustomFontsManager
                  fonts={customFonts ?? []}
                  onChange={setCustomFonts}
                />
              </>
            )}

            {activeTab === 'seo' && (
              <>
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
                  description="1-2 sentence summary for search results. Keep under 160 characters."
                  value={metaDescription}
                  onChange={setMetaDescription}
                  placeholder="Fully inclusive packages for the 2026 Italian Grand Prix..."
                  rows={3}
                />
                <FieldBoolean
                  label="Hide from search engines (noindex)"
                  description="Useful for private or draft brochures that are published but shouldn't appear on Google."
                  value={noIndex}
                  onChange={setNoIndex}
                />
              </>
            )}

            {activeTab === 'lead' && (
              <>
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
              </>
            )}

            {error ? <div className="field-error" style={{ marginTop: 12 }}>{error}</div> : null}
          </div>
        </div>

        <footer className="new-brochure-footer">
          <button className="editor-topbar-btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="editor-topbar-btn primary" onClick={handleSave} disabled={pending}>
            {pending ? 'Saving...' : 'Save settings'}
          </button>
        </footer>
      </div>
    </div>
    </>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="settings-section-header">
      {label}
    </div>
  )
}

/** Injects <link> tags for any Google Fonts needed by the current selections. */
function FontPreviewLinks({ slugs }: { slugs: (string | undefined)[] }) {
  const urls = slugs
    .map((s) => googleFontsUrlForSlug(s))
    .filter((u): u is string => u !== null)
  // Deduplicate
  const unique = [...new Set(urls)]
  return (
    <>
      {unique.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
    </>
  )
}

const WEIGHT_OPTIONS = [
  { value: '100', label: '100 · Thin' },
  { value: '200', label: '200 · Extra Light' },
  { value: '300', label: '300 · Light' },
  { value: '400', label: '400 · Regular' },
  { value: '500', label: '500 · Medium' },
  { value: '600', label: '600 · Semi Bold' },
  { value: '700', label: '700 · Bold' },
  { value: '800', label: '800 · Extra Bold' },
  { value: '900', label: '900 · Black' },
]

// ── FontCard (simplified — no upload logic) ─────────────────────────────

type FontCardProps = {
  role: string
  label: string
  description: string
  previewText: string
  previewSize: number
  previewItalic?: boolean
  previewUppercase?: boolean
  previewTransform?: string | undefined
  fontSlug: string | undefined
  fontWeight: string | undefined
  customFonts?: CustomFont[] | null
  onFontChange: (slug: string) => void
  onWeightChange: (weight: string) => void
  extraControls?: React.ReactNode
}

function FontCard({
  role, label, description, previewText, previewSize,
  previewItalic, previewUppercase, previewTransform,
  fontSlug, fontWeight,
  customFonts, onFontChange, onWeightChange,
  extraControls,
}: FontCardProps) {
  const family = fontFamilyForSlug(fontSlug, role, customFonts)
  const weight = fontWeight || undefined
  const transform = previewTransform || (previewUppercase ? 'uppercase' : undefined)

  return (
    <div className="font-card">
      <div
        className="font-card-preview"
        style={{
          fontFamily: family,
          fontWeight: weight,
          fontSize: previewSize,
          fontStyle: previewItalic ? 'italic' : undefined,
          textTransform: transform as React.CSSProperties['textTransform'],
          letterSpacing: transform === 'uppercase' ? '0.12em' : undefined,
        }}
      >
        {previewText}
      </div>
      <div className="font-card-meta">
        <span className="font-card-label">{label}</span>
        <span className="font-card-desc">{description}</span>
      </div>
      <div className="font-card-controls">
        <FieldSelect
          label="Family"
          value={fontSlug ?? ''}
          onChange={onFontChange}
          options={fontOptionsForRole(role, customFonts)}
        />
        <FieldSelect
          label="Weight"
          value={fontWeight ?? ''}
          onChange={onWeightChange}
          options={weightOptionsForRole(role, fontSlug, customFonts)}
        />
        {extraControls}
      </div>
    </div>
  )
}

// ── CustomFontsManager (shared font library) ────────────────────────────

function CustomFontsManager({
  fonts,
  onChange,
}: {
  fonts: CustomFont[]
  onChange: (fonts: CustomFont[] | undefined) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  /** Read a font file as a base64 data URI. */
  function readAsDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  /** Validate that the browser can actually parse and render the font. */
  async function validateFont(dataUri: string): Promise<void> {
    const res = await fetch(dataUri)
    const buf = await res.arrayBuffer()
    const face = new FontFace('__validate__', buf)
    await face.load()
  }

  /** Read, validate, and return a data URI for a font file. Throws on failure. */
  async function readAndValidateFont(file: File): Promise<string> {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Font file too large (max 2MB). Use a WOFF2 file for smaller sizes.')
    }
    const dataUri = await readAsDataUri(file)
    try {
      await validateFont(dataUri)
    } catch {
      throw new Error(
        `"${file.name}" could not be loaded — the font file appears to be corrupted or uses an unsupported format. Try converting it to WOFF2 at fonts.google.com/knowledge or transfonter.org.`
      )
    }
    return dataUri
  }

  function handleAddFont() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.woff2,.woff,.ttf,.otf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true)
      setUploadError(null)
      try {
        const dataUri = await readAndValidateFont(file)
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        const newFont: CustomFont = {
          _key: nanokey(),
          name,
          weights: [{ _key: nanokey(), weight: '400', dataUri }],
        }
        onChange([...fonts, newFont])
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  function handleAddWeight(fontKey: string, targetWeight: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.woff2,.woff,.ttf,.otf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true)
      setUploadError(null)
      try {
        const dataUri = await readAndValidateFont(file)
        const newWeight: CustomFontWeight = { _key: nanokey(), weight: targetWeight, dataUri }
        onChange(fonts.map((f) =>
          f._key === fontKey
            ? { ...f, weights: [...f.weights.filter((w) => w.weight !== targetWeight), newWeight] }
            : f
        ))
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  function handleRemoveFont(fontKey: string) {
    const next = fonts.filter((f) => f._key !== fontKey)
    onChange(next.length > 0 ? next : undefined)
  }

  function handleRemoveWeight(fontKey: string, weightKey: string) {
    onChange(fonts.map((f) => {
      if (f._key !== fontKey) return f
      const nextWeights = f.weights.filter((w) => w._key !== weightKey)
      return { ...f, weights: nextWeights }
    }).filter((f) => f.weights.length > 0))
  }

  function handleRename(fontKey: string, name: string) {
    onChange(fonts.map((f) => f._key === fontKey ? { ...f, name } : f))
  }

  if (fonts.length === 0) {
    return (
      <div>
        <div className="font-card-desc" style={{ marginBottom: 8 }}>
          Upload .woff2, .ttf, .otf, or .woff files. Uploaded fonts appear in every font family dropdown above.
        </div>
        <button type="button" className="field-btn" onClick={handleAddFont} disabled={uploading}>
          {uploading ? 'Validating...' : '+ Upload font'}
        </button>
        {uploadError ? <div className="field-error" style={{ marginTop: 8 }}>{uploadError}</div> : null}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fonts.map((font) => (
        <div key={font._key} className="custom-color-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              className="field-input"
              value={font.name}
              onChange={(e) => handleRename(font._key, e.target.value)}
              placeholder="Font name"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="custom-color-remove"
              onClick={() => handleRemoveFont(font._key)}
              title="Remove font"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="font-card-weights">
            {font.weights
              .slice()
              .sort((a, b) => Number(a.weight) - Number(b.weight))
              .map((w) => (
                <div key={w._key} className="font-card-weight-row">
                  <span className="font-card-weight-label">
                    {WEIGHT_OPTIONS.find((o) => o.value === w.weight)?.label ?? w.weight}
                  </span>
                  <button
                    type="button"
                    className="custom-color-remove"
                    onClick={() => handleRemoveWeight(font._key, w._key)}
                    title="Remove weight"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
          <select
            className="field-input field-select"
            value=""
            onChange={(e) => { if (e.target.value) handleAddWeight(font._key, e.target.value) }}
            disabled={uploading}
            style={{ fontSize: 11 }}
          >
            <option value="">+ Add weight...</option>
            {WEIGHT_OPTIONS
              .filter((o) => !font.weights.some((w) => w.weight === o.value))
              .map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
          </select>
        </div>
      ))}
      <button type="button" className="field-btn" onClick={handleAddFont} disabled={uploading}>
        {uploading ? 'Validating...' : '+ Upload another font'}
      </button>
      {uploadError ? <div className="field-error" style={{ marginTop: 8 }}>{uploadError}</div> : null}
    </div>
  )
}
