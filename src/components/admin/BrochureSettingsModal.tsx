'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Brochure, BrochureTheme, CustomColor, CustomFont, CustomFontWeight, FontOverrides, SanityImage, TextScalePreset } from '@/types/brochure'
import { Sun, Moon } from 'lucide-react'
import type { CompanyOption } from './BrochureEditor'
import { updateBrochureSettingsAction } from '@/lib/sanity/actions'
import { nanokey } from '@/lib/nanokey'
import { customFontSlug, customFontFaceCss } from '@/lib/fontPalette'
import { FontCard, FontPreviewLinks, SCALE_OPTIONS } from './typographyControls'
import { FieldInput } from './fields/FieldInput'
import { FieldTextarea } from './fields/FieldTextarea'
import { FieldDictateTextarea } from './fields/FieldDictateTextarea'
import { FieldBoolean } from './fields/FieldBoolean'
import { FieldSelect } from './fields/FieldSelect'
import { FieldColor } from './fields/FieldColor'
import { FieldImage } from './fields/FieldImage'
import { urlForSection } from '@/lib/sanity/image'

type Props = {
  open: boolean
  brochure: Brochure
  companies: CompanyOption[]
  /** When false, the AI brief tab is hidden — the server has no Anthropic
   *  API key and AI features are disabled. */
  aiServerEnabled: boolean
  onClose: () => void
  onSaved: (updates: {
    /** New `_rev` from the server. Editor merges this into brochure state
     *  so `useAutosave` adopts it and the next autosave doesn't 409. */
    rev: string
    slug: { _type: 'slug'; current: string }
    season: string
    event: string
    seo: NonNullable<Brochure['seo']>
    leadCapture: NonNullable<Brochure['leadCapture']>
    theme: BrochureTheme
    accentColor: string | undefined
    backgroundColor: string | undefined
    textColor: string | undefined
    titleColor: string | undefined
    bodyColor: string | undefined
    eyebrowItalic: boolean | undefined
    eyebrowTransform: string | undefined
    titleItalic: boolean | undefined
    titleTransform: string | undefined
    aiBrief: { prompt?: string; sources?: string[]; generatedAt?: string } | undefined
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
    companyId: string | undefined
    /** Snapshot of the newly-assigned company's branding (or undefined when
     *  the brochure is canonical). Lets the editor refresh the live-fallback
     *  preview without waiting for a re-fetch. */
    companyBranding: Brochure['companyBranding'] | undefined
  }) => void
}

type SettingsTab = 'general' | 'branding' | 'typography' | 'seo' | 'lead' | 'ai'

const BASE_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'typography', label: 'Typography' },
  { key: 'seo', label: 'SEO' },
  { key: 'lead', label: 'Lead capture' },
]

const AI_TAB: { key: SettingsTab; label: string } = { key: 'ai', label: 'AI brief' }

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
export function BrochureSettingsModal({ open, brochure, companies, aiServerEnabled, onClose, onSaved }: Props) {
  const TABS = aiServerEnabled ? [...BASE_TABS, AI_TAB] : BASE_TABS
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
  const [theme, setTheme] = useState<BrochureTheme>(brochure.theme ?? 'dark')
  const [accentColor, setAccentColor] = useState<string | undefined>(brochure.accentColor)
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(brochure.backgroundColor)
  const [textColor, setTextColor] = useState<string | undefined>(brochure.textColor)
  const [titleColor, setTitleColor] = useState<string | undefined>(brochure.titleColor)
  const [bodyColor, setBodyColor] = useState<string | undefined>(brochure.bodyColor)
  const [eyebrowItalic, setEyebrowItalic] = useState<boolean | undefined>(brochure.eyebrowItalic)
  const [eyebrowTransform, setEyebrowTransform] = useState<string | undefined>(brochure.eyebrowTransform)
  const [titleItalic, setTitleItalic] = useState<boolean | undefined>(brochure.titleItalic)
  const [titleTransform, setTitleTransform] = useState<string | undefined>(brochure.titleTransform)
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
  const [companyId, setCompanyId] = useState<string | undefined>(brochure.company?._ref)
  const [briefPrompt, setBriefPrompt] = useState<string>(brochure.aiBrief?.prompt ?? '')
  const [briefSources, setBriefSources] = useState<string[]>(
    brochure.aiBrief?.sources && brochure.aiBrief.sources.length > 0
      ? brochure.aiBrief.sources
      : ['']
  )
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
    setTheme(brochure.theme ?? 'dark')
    setAccentColor(brochure.accentColor)
    setBackgroundColor(brochure.backgroundColor)
    setTextColor(brochure.textColor)
    setTitleColor(brochure.titleColor)
    setBodyColor(brochure.bodyColor)
    setEyebrowItalic(brochure.eyebrowItalic)
    setEyebrowTransform(brochure.eyebrowTransform)
    setTitleItalic(brochure.titleItalic)
    setTitleTransform(brochure.titleTransform)
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
    setCompanyId(brochure.company?._ref)
    setBriefPrompt(brochure.aiBrief?.prompt ?? '')
    setBriefSources(
      brochure.aiBrief?.sources && brochure.aiBrief.sources.length > 0
        ? brochure.aiBrief.sources
        : ['']
    )
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
          theme,
          seo,
          leadCapture,
          accentColor: accentColor ?? null,
          backgroundColor: backgroundColor ?? null,
          textColor: textColor ?? null,
          titleColor: titleColor ?? null,
          bodyColor: bodyColor ?? null,
          eyebrowItalic: eyebrowItalic ?? null,
          eyebrowTransform: eyebrowTransform ?? null,
          titleItalic: titleItalic ?? null,
          titleTransform: titleTransform ?? null,
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
          companyId: companyId ?? null,
          aiBrief: (() => {
            const cleanedSources = briefSources.map((s) => s.trim()).filter(Boolean)
            const cleanedPrompt = briefPrompt.trim()
            if (!cleanedPrompt && cleanedSources.length === 0) return null
            return {
              prompt: cleanedPrompt || undefined,
              sources: cleanedSources.length ? cleanedSources : undefined,
            }
          })(),
        },
        brochure.slug.current
      )
      if (!res.ok) {
        setError(res.error)
        return
      }
      onSaved({
        rev: res.rev,
        slug: { _type: 'slug', current: normalisedSlug },
        season: season.trim(),
        event: event.trim(),
        seo,
        leadCapture,
        theme,
        accentColor,
        backgroundColor,
        textColor,
        titleColor,
        bodyColor,
        eyebrowItalic,
        eyebrowTransform,
        titleItalic,
        titleTransform,
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
        companyId,
        companyBranding: selectedCompany
          ? {
              _id: selectedCompany._id,
              name: selectedCompany.name,
              theme: selectedCompany.theme,
              accentColor: selectedCompany.accentColor,
              backgroundColor: selectedCompany.backgroundColor,
              textColor: selectedCompany.textColor,
              titleColor: selectedCompany.titleColor,
              bodyColor: selectedCompany.bodyColor,
              navColor: selectedCompany.navColor,
              logo: selectedCompany.logo,
              textureImage: selectedCompany.textureImage,
              hideTexture: selectedCompany.hideTexture,
              eyebrowItalic: selectedCompany.eyebrowItalic,
              eyebrowTransform: selectedCompany.eyebrowTransform,
              titleItalic: selectedCompany.titleItalic,
              titleTransform: selectedCompany.titleTransform,
              fontOverrides: selectedCompany.fontOverrides,
              titleScale: selectedCompany.titleScale,
              eyebrowScale: selectedCompany.eyebrowScale,
              taglineScale: selectedCompany.taglineScale,
            }
          : undefined,
        aiBrief: (() => {
          const cleanedSources = briefSources.map((s) => s.trim()).filter(Boolean)
          const cleanedPrompt = briefPrompt.trim()
          if (!cleanedPrompt && cleanedSources.length === 0) return undefined
          return {
            prompt: cleanedPrompt || undefined,
            sources: cleanedSources.length ? cleanedSources : undefined,
            generatedAt: brochure.aiBrief?.generatedAt,
          }
        })(),
      })
      onClose()
    })
  }

  // ───────── Inherited branding from the selected host company ─────────
  // When the brochure has a company assigned, its branding/typography defaults
  // act as fallbacks (Branding/Typography tab placeholders + descriptions).
  // Empty brochure-level values inherit live; an explicit value here overrides.
  const selectedCompany = companyId ? companies.find((c) => c._id === companyId) ?? null : null
  const inheritedAccent = selectedCompany?.accentColor || undefined
  const inheritedBackground = selectedCompany?.backgroundColor || undefined
  const inheritedText = selectedCompany?.textColor || undefined
  const inheritedTitle = selectedCompany?.titleColor || undefined
  const inheritedBody = selectedCompany?.bodyColor || undefined
  const inheritedNav = selectedCompany?.navColor || undefined
  const inheritedTheme = selectedCompany?.theme
  const inheritedLogoUrl = selectedCompany?.logo
    ? urlForSection(selectedCompany.logo, 400) ?? undefined
    : undefined
  const inheritedTextureUrl = selectedCompany?.textureImage
    ? urlForSection(selectedCompany.textureImage, 600) ?? undefined
    : undefined
  const inheritedFonts = selectedCompany?.fontOverrides
  const inheritedTitleScale = selectedCompany?.titleScale
  const inheritedEyebrowScale = selectedCompany?.eyebrowScale
  const inheritedTaglineScale = selectedCompany?.taglineScale
  const inheritedTitleItalic = selectedCompany?.titleItalic
  const inheritedTitleTransform = selectedCompany?.titleTransform
  const inheritedEyebrowItalic = selectedCompany?.eyebrowItalic
  const inheritedEyebrowTransform = selectedCompany?.eyebrowTransform
  const inheritedHint = (label: string) =>
    selectedCompany ? `Inherited from ${selectedCompany.name}` : label

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
                <FieldSelect
                  label="Host company"
                  description="Which subdomain serves this brochure. Leave on Grand Prix Grand Tours to host on brochures.grandprixgrandtours.com."
                  value={companyId ?? ''}
                  onChange={(v) => setCompanyId(v || undefined)}
                  options={[
                    { value: '', label: 'Grand Prix Grand Tours' },
                    ...companies.map((c) => ({
                      value: c._id,
                      label: `${c.name} (${c.domain})`,
                    })),
                  ]}
                />
              </>
            )}

            {activeTab === 'branding' && (
              <>
                <SectionHeader label="Colours" />
                {selectedCompany ? (
                  <div className="settings-inherit-hint">
                    Empty fields inherit from <strong>{selectedCompany.name}</strong>. Set a value to override the company default.
                  </div>
                ) : null}
                {(() => {
                  const themeDisabled = Boolean(titleColor || textColor || backgroundColor || navColor)
                  return (
                    <>
                      <div className="settings-subgroup-label">Theme</div>
                      <div
                        className="editor-icon-segment brochure-theme-toggle"
                        role="group"
                        aria-label="Brochure theme"
                        aria-disabled={themeDisabled}
                      >
                        <button
                          type="button"
                          className={`editor-icon-segment-btn ${theme === 'dark' ? 'active' : ''}`.trim()}
                          onClick={() => setTheme('dark')}
                          disabled={themeDisabled}
                          aria-pressed={theme === 'dark'}
                          aria-label="Dark theme"
                          title="Dark theme"
                        >
                          <Moon size={15} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`editor-icon-segment-btn ${theme === 'light' ? 'active' : ''}`.trim()}
                          onClick={() => setTheme('light')}
                          disabled={themeDisabled}
                          aria-pressed={theme === 'light'}
                          aria-label="Light theme"
                          title="Light theme"
                        >
                          <Sun size={15} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="settings-help-hint">
                        {themeDisabled
                          ? 'Theme is overridden by Title, Text, Background, or Navigation colour. Clear those fields to switch theme.'
                          : 'Sets the default Title, Text, Background, and Navigation colours.'}
                      </div>
                    </>
                  )
                })()}
                <div className="settings-subgroup-label">Brand colours</div>
                <div className="brand-colors-compact">
                  <FieldColor
                    label="Accent"
                    description={
                      !accentColor && inheritedAccent
                        ? `Inherited from ${selectedCompany?.name}`
                        : undefined
                    }
                    value={accentColor}
                    onChange={setAccentColor}
                    fallback={inheritedAccent || '#cf212a'}
                  />
                  <FieldColor
                    label="Title"
                    description={
                      !titleColor && inheritedTitle
                        ? `Inherited from ${selectedCompany?.name}`
                        : undefined
                    }
                    value={titleColor}
                    onChange={setTitleColor}
                    fallback={inheritedTitle || (brochure.theme === 'light' ? '#161618' : '#ffffff')}
                  />
                  <FieldColor
                    label="Text"
                    description={
                      !textColor && inheritedText
                        ? `Inherited from ${selectedCompany?.name}`
                        : undefined
                    }
                    value={textColor}
                    onChange={setTextColor}
                    fallback={inheritedText || (brochure.theme === 'light' ? '#161618' : '#ffffff')}
                  />
                  <FieldColor
                    label="Background"
                    description={
                      !backgroundColor && inheritedBackground
                        ? `Inherited from ${selectedCompany?.name}`
                        : undefined
                    }
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    fallback={inheritedBackground || (brochure.theme === 'light' ? '#f6f5f1' : '#161618')}
                  />
                  <FieldColor
                    label="Navigation"
                    description={
                      !navColor && inheritedNav
                        ? `Inherited from ${selectedCompany?.name}`
                        : undefined
                    }
                    value={navColor}
                    onChange={setNavColor}
                    fallback={inheritedNav || '#161618'}
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
                          value={c.hex || '#cf212a'}
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
                          placeholder="#cf212a"
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
                  onClick={() => setCustomColors((prev) => [...prev, { _key: nanokey(), name: '', hex: '#cf212a' }])}
                >
                  + Add colour
                </button>

                <SectionHeader label="Logo" />
                <div className="logo-image-field">
                  <FieldImage
                    label="Logo"
                    description={
                      !logo && inheritedLogoUrl
                        ? `Inherited from ${selectedCompany?.name}. Upload to override.`
                        : 'Replaces the GPGT logo in the brochure nav. Leave blank to use the default.'
                    }
                    value={logo}
                    onChange={setLogo}
                    previewWidth={400}
                    defaultPreview={inheritedLogoUrl ?? '/textures/Grand_Prix_Logo_Vector_Editable 5.png'}
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
                      description={
                        !textureImage && inheritedTextureUrl
                          ? `Inherited from ${selectedCompany?.name}. Upload to override.`
                          : 'Replaces the default halftone texture across all textured sections.'
                      }
                      value={textureImage}
                      onChange={setTextureImage}
                      defaultPreview={inheritedTextureUrl ?? '/textures/halftone.png'}
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
                {selectedCompany ? (
                  <div className="settings-inherit-hint">
                    Empty fields inherit from <strong>{selectedCompany.name}</strong>. Set a value to override the company default.
                  </div>
                ) : null}
                <SectionHeader label="Type scale" />
                <FieldSelect
                  label="Title"
                  description={
                    !titleScale && inheritedTitleScale
                      ? `Inherited from ${selectedCompany?.name}`
                      : 'Scale factor for headline and title text across the brochure.'
                  }
                  value={titleScale ?? inheritedTitleScale ?? 'm'}
                  onChange={(v) => setTitleScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={SCALE_OPTIONS}
                />
                <FieldSelect
                  label="Eyebrow"
                  description={
                    !eyebrowScale && inheritedEyebrowScale
                      ? `Inherited from ${selectedCompany?.name}`
                      : 'Scale factor for eyebrow text across the brochure.'
                  }
                  value={eyebrowScale ?? inheritedEyebrowScale ?? 'm'}
                  onChange={(v) => setEyebrowScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={SCALE_OPTIONS}
                />
                <FieldSelect
                  label="Body text"
                  description={
                    !taglineScale && inheritedTaglineScale
                      ? `Inherited from ${selectedCompany?.name}`
                      : 'Scale factor for body, tagline, and subtitle text across the brochure.'
                  }
                  value={taglineScale ?? inheritedTaglineScale ?? 'm'}
                  onChange={(v) => setTaglineScale(v === 'm' ? undefined : (v as TextScalePreset))}
                  options={SCALE_OPTIONS}
                />

                <SectionHeader label="Fonts" />
                <FontCard
                  role="display"
                  label="Title"
                  description={
                    !fontDisplay && inheritedFonts?.display
                      ? `Headlines and display text · inherited from ${selectedCompany?.name}`
                      : 'Headlines and display text'
                  }
                  previewText="Monaco Grand Prix"
                  previewSize={28}
                  previewItalic={titleItalic ?? false}
                  previewUppercase={titleTransform === 'uppercase' || titleTransform === undefined}
                  previewTransform={titleTransform ?? 'uppercase'}
                  fontSlug={fontDisplay}
                  fontWeight={fontDisplayWeight}
                  customFonts={customFonts}
                  onFontChange={(v) => { setFontDisplay(v || undefined); setFontDisplayWeight(undefined) }}
                  onWeightChange={(v) => setFontDisplayWeight(v || undefined)}
                  extraControls={
                    <>
                      <FieldSelect
                        label="Style"
                        value={titleItalic === true ? 'italic' : 'upright'}
                        onChange={(v) => setTitleItalic(v === 'italic' ? true : undefined)}
                        options={[
                          { value: 'upright', label: 'Upright' },
                          { value: 'italic', label: 'Italic' },
                        ]}
                      />
                      <FieldSelect
                        label="Letter case"
                        value={titleTransform ?? ''}
                        onChange={(v) => setTitleTransform(v || undefined)}
                        options={[
                          { value: '', label: 'Uppercase (default)' },
                          { value: 'none', label: 'As typed' },
                          { value: 'lowercase', label: 'lowercase' },
                          { value: 'capitalize', label: 'Capitalize' },
                        ]}
                      />
                    </>
                  }
                />
                <FontCard
                  role="script"
                  label="Eyebrow"
                  description={
                    !fontScript && inheritedFonts?.script
                      ? `Eyebrow and accent text · inherited from ${selectedCompany?.name}`
                      : 'Eyebrow and accent text'
                  }
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
                  description={
                    !fontBody && inheritedFonts?.body
                      ? `Paragraph and body text · inherited from ${selectedCompany?.name}`
                      : 'Paragraph and body text'
                  }
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
                  description={
                    !fontMono && inheritedFonts?.mono
                      ? `Labels, meta text, and data · inherited from ${selectedCompany?.name}`
                      : 'Labels, meta text, and data'
                  }
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

            {activeTab === 'ai' && (
              <>
                <FieldDictateTextarea
                  label="Brief"
                  description="The free-form context the AI used to generate this brochure. Edit it to refine per-field AI assists. The brief is the single source of truth for tone, audience, must-haves and constraints. Click Dictate to speak it instead of typing."
                  value={briefPrompt}
                  onChange={setBriefPrompt}
                  rows={10}
                  placeholder="What this brochure is for, who it's for, the tone, the must-haves…"
                />
                <div className="field-group">
                  <label className="field-label">
                    <span className="field-label-text">Reference URLs</span>
                  </label>
                  <div className="field-description" style={{ marginBottom: 6 }}>
                    Up to 5 links the AI can use as background context. Optional.
                  </div>
                  {briefSources.map((u, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input
                        className="field-input"
                        value={u}
                        onChange={(e) => {
                          const next = [...briefSources]
                          next[i] = e.target.value
                          setBriefSources(next)
                        }}
                        placeholder="https://www.formula1.com/…"
                      />
                      {briefSources.length > 1 ? (
                        <button
                          type="button"
                          className="editor-topbar-btn"
                          onClick={() => setBriefSources(briefSources.filter((_, j) => j !== i))}
                          style={{ flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {briefSources.length < 5 ? (
                    <button
                      type="button"
                      className="editor-topbar-btn"
                      onClick={() => setBriefSources([...briefSources, ''])}
                      style={{ marginTop: 2 }}
                    >
                      + Add URL
                    </button>
                  ) : null}
                </div>
                {brochure.aiBrief?.generatedAt ? (
                  <div className="field-description" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6 }}>
                    Originally generated {new Date(brochure.aiBrief.generatedAt).toLocaleString('en-GB')}
                  </div>
                ) : null}
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
