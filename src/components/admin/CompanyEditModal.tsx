'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
  getDomainStatusAction,
  attachDomainAction,
  uploadImageAction,
} from '@/lib/sanity/actions'
import { urlForSection } from '@/lib/sanity/image'
import type {
  BrochureTheme,
  CustomFont,
  FontOverrides,
  SanityImage,
  TextScalePreset,
} from '@/types/brochure'
import { FieldColor } from './fields/FieldColor'
import { FieldImage } from './fields/FieldImage'
import { FieldSelect } from './fields/FieldSelect'
import { Sun, Moon } from 'lucide-react'
import { FontCard, FontPreviewLinks, SCALE_OPTIONS } from './typographyControls'

export type CompanyFormSource = {
  _id: string
  name: string
  slug?: string
  domain: string
  displayName: string
  website?: string
  accentColor?: string
  logo?: SanityImage
  favicon?: SanityImage
  /** Branding defaults — inherited by brochures of this company. */
  theme?: BrochureTheme
  backgroundColor?: string
  textColor?: string
  titleColor?: string
  bodyColor?: string
  navColor?: string
  textureImage?: SanityImage
  hideTexture?: boolean
  /** Typography defaults. */
  eyebrowItalic?: boolean
  eyebrowTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  titleItalic?: boolean
  titleTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  fontOverrides?: FontOverrides
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  taglineScale?: TextScalePreset
}

type CompanyTab = 'general' | 'branding' | 'typography' | 'dns'

const COMPANY_TABS: { key: CompanyTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'typography', label: 'Typography' },
  { key: 'dns', label: 'DNS' },
]

type Props = {
  open: boolean
  onClose: () => void
  /** When set, modal runs in edit mode. */
  source?: CompanyFormSource
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

/** Strip protocol / path / port and lowercase. */
function cleanHost(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
}

/**
 * Default mode: take a root domain and prepend `brochures.` (idempotently).
 */
function deriveDefaultHost(rootDomain: string): string {
  const cleaned = cleanHost(rootDomain)
  if (!cleaned) return ''
  if (cleaned.startsWith('brochures.')) return cleaned
  return `brochures.${cleaned}`
}

type DomainStatusState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'unconfigured' }
  | { kind: 'not_attached' }
  | { kind: 'attaching' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ok'
      verified: boolean
      misconfigured: boolean
      recommendedCNAME?: string
    }

/**
 * Combined create/edit modal for a Company. In edit mode, exposes a delete
 * button (blocked server-side if any brochures still reference the company)
 * and shows DNS verification status from Vercel.
 */
export function CompanyEditModal({ open, onClose, source }: Props) {
  const router = useRouter()
  const isEdit = Boolean(source)

  const [activeTab, setActiveTab] = useState<CompanyTab>('general')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  // Two-mode hosting domain input. Default mode auto-prepends `brochures.`;
  // custom mode accepts whatever full host the admin types (e.g. when GPGT
  // controls DNS for a subdomain like `textbook.grandstandtickets.com`).
  const [domainMode, setDomainMode] = useState<'default' | 'custom'>('default')
  const [rootDomain, setRootDomain] = useState('')
  const [customHost, setCustomHost] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayNameDirty, setDisplayNameDirty] = useState(false)
  const [website, setWebsite] = useState('')
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined)
  const [logo, setLogo] = useState<SanityImage | undefined>(undefined)
  const [logoUploading, setLogoUploading] = useState(false)
  const [favicon, setFavicon] = useState<SanityImage | undefined>(undefined)
  const [faviconUploading, setFaviconUploading] = useState(false)
  // ── Branding defaults ──
  const [theme, setTheme] = useState<BrochureTheme | undefined>(undefined)
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined)
  const [textColor, setTextColor] = useState<string | undefined>(undefined)
  const [titleColor, setTitleColor] = useState<string | undefined>(undefined)
  const [bodyColor, setBodyColor] = useState<string | undefined>(undefined)
  const [navColor, setNavColor] = useState<string | undefined>(undefined)
  const [textureImage, setTextureImage] = useState<SanityImage | undefined>(undefined)
  const [hideTexture, setHideTexture] = useState(false)
  // ── Typography defaults ──
  const [titleItalic, setTitleItalic] = useState<boolean | undefined>(undefined)
  const [titleTransform, setTitleTransform] = useState<string | undefined>(undefined)
  const [eyebrowItalic, setEyebrowItalic] = useState<boolean | undefined>(undefined)
  const [eyebrowTransform, setEyebrowTransform] = useState<string | undefined>(undefined)
  const [fontDisplay, setFontDisplay] = useState<string | undefined>(undefined)
  const [fontDisplayWeight, setFontDisplayWeight] = useState<string | undefined>(undefined)
  const [fontScript, setFontScript] = useState<string | undefined>(undefined)
  const [fontScriptWeight, setFontScriptWeight] = useState<string | undefined>(undefined)
  const [fontBody, setFontBody] = useState<string | undefined>(undefined)
  const [fontBodyWeight, setFontBodyWeight] = useState<string | undefined>(undefined)
  const [fontMono, setFontMono] = useState<string | undefined>(undefined)
  const [fontMonoWeight, setFontMonoWeight] = useState<string | undefined>(undefined)
  const [titleScale, setTitleScale] = useState<TextScalePreset | undefined>(undefined)
  const [eyebrowScale, setEyebrowScale] = useState<TextScalePreset | undefined>(undefined)
  const [taglineScale, setTaglineScale] = useState<TextScalePreset | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [domainStatus, setDomainStatus] = useState<DomainStatusState>({ kind: 'idle' })
  // Set after a successful create so the modal stays open and pivots to a
  // DNS-setup view instead of bouncing the admin back to the list.
  const [createdInfo, setCreatedInfo] = useState<{ id: string; domain: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const faviconFileRef = useRef<HTMLInputElement>(null)

  const derivedHost =
    domainMode === 'default' ? deriveDefaultHost(rootDomain) : cleanHost(customHost)

  useEffect(() => {
    if (!open) {
      setActiveTab('general')
      setName('')
      setSlug('')
      setSlugDirty(false)
      setDomainMode('default')
      setRootDomain('')
      setCustomHost('')
      setDisplayName('')
      setDisplayNameDirty(false)
      setWebsite('')
      setAccentColor(undefined)
      setLogo(undefined)
      setFavicon(undefined)
      setTheme(undefined)
      setBackgroundColor(undefined)
      setTextColor(undefined)
      setTitleColor(undefined)
      setBodyColor(undefined)
      setNavColor(undefined)
      setTextureImage(undefined)
      setHideTexture(false)
      setTitleItalic(undefined)
      setTitleTransform(undefined)
      setEyebrowItalic(undefined)
      setEyebrowTransform(undefined)
      setFontDisplay(undefined)
      setFontDisplayWeight(undefined)
      setFontScript(undefined)
      setFontScriptWeight(undefined)
      setFontBody(undefined)
      setFontBodyWeight(undefined)
      setFontMono(undefined)
      setFontMonoWeight(undefined)
      setTitleScale(undefined)
      setEyebrowScale(undefined)
      setTaglineScale(undefined)
      setError(null)
      setWarning(null)
      setConfirmDelete(false)
      setDomainStatus({ kind: 'idle' })
      setCreatedInfo(null)
      return
    }
    if (source) {
      setActiveTab('general')
      setName(source.name)
      setSlug(source.slug ?? '')
      setSlugDirty(true)
      // Detect mode from the stored host: hosts that begin with `brochures.`
      // round-trip through default mode; anything else is custom.
      if (source.domain.startsWith('brochures.')) {
        setDomainMode('default')
        setRootDomain(source.domain.slice('brochures.'.length))
        setCustomHost(source.domain)
      } else {
        setDomainMode('custom')
        setCustomHost(source.domain)
        setRootDomain('')
      }
      setDisplayName(source.displayName)
      setDisplayNameDirty(true)
      setWebsite(source.website ?? '')
      setAccentColor(source.accentColor || undefined)
      setLogo(source.logo)
      setFavicon(source.favicon)
      setTheme(source.theme)
      setBackgroundColor(source.backgroundColor || undefined)
      setTextColor(source.textColor || undefined)
      setTitleColor(source.titleColor || undefined)
      setBodyColor(source.bodyColor || undefined)
      setNavColor(source.navColor || undefined)
      setTextureImage(source.textureImage)
      setHideTexture(Boolean(source.hideTexture))
      setTitleItalic(source.titleItalic)
      setTitleTransform(source.titleTransform)
      setEyebrowItalic(source.eyebrowItalic)
      setEyebrowTransform(source.eyebrowTransform)
      setFontDisplay(source.fontOverrides?.display)
      setFontDisplayWeight(source.fontOverrides?.displayWeight)
      setFontScript(source.fontOverrides?.script)
      setFontScriptWeight(source.fontOverrides?.scriptWeight)
      setFontBody(source.fontOverrides?.body)
      setFontBodyWeight(source.fontOverrides?.bodyWeight)
      setFontMono(source.fontOverrides?.mono)
      setFontMonoWeight(source.fontOverrides?.monoWeight)
      setTitleScale(source.titleScale)
      setEyebrowScale(source.eyebrowScale)
      setTaglineScale(source.taglineScale)
    }
  }, [open, source])

  // Auto-derive slug + displayName from name unless edited manually.
  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name))
  }, [name, slugDirty])
  useEffect(() => {
    if (!displayNameDirty) setDisplayName(name)
  }, [name, displayNameDirty])

  // Active host being managed in the modal — `source` for edit, `createdInfo`
  // immediately after a successful create.
  const activeHost = source?.domain ?? createdInfo?.domain ?? null

  // Fetch DNS status when an active host appears (edit mode opening, or just
  // after successful create).
  useEffect(() => {
    if (!open || !activeHost) return
    setDomainStatus({ kind: 'loading' })
    getDomainStatusAction(activeHost).then((res) => {
      if (!res.ok) {
        setDomainStatus({ kind: 'error', message: res.error })
        return
      }
      if ('configured' in res && !res.configured) {
        setDomainStatus({ kind: 'unconfigured' })
        return
      }
      if ('notAttached' in res && res.notAttached) {
        setDomainStatus({ kind: 'not_attached' })
        return
      }
      if ('status' in res) {
        setDomainStatus({
          kind: 'ok',
          verified: res.status.verified,
          misconfigured: res.status.misconfigured,
          recommendedCNAME: res.status.recommendedCNAME,
        })
      }
    })
  }, [open, activeHost])

  // Auto-poll DNS while waiting for the admin to add the CNAME at the
  // registrar. Stops once fully verified or on a hard error/unconfigured state.
  const isPendingVerification =
    domainStatus.kind === 'ok' && (!domainStatus.verified || domainStatus.misconfigured)
  useEffect(() => {
    if (!open || !activeHost || !isPendingVerification) return
    const id = setInterval(() => {
      getDomainStatusAction(activeHost).then((res) => {
        if (!res.ok) return
        if ('status' in res) {
          setDomainStatus({
            kind: 'ok',
            verified: res.status.verified,
            misconfigured: res.status.misconfigured,
            recommendedCNAME: res.status.recommendedCNAME,
          })
        }
      })
    }, 10000)
    return () => clearInterval(id)
  }, [open, activeHost, isPendingVerification])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, pending])

  if (!open) return null

  async function handleLogoFile(file: File) {
    setLogoUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await uploadImageAction(fd)
      if (res.ok) setLogo(res.image)
      else setError(res.error)
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleFaviconFile(file: File) {
    setFaviconUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await uploadImageAction(fd)
      if (res.ok) setFavicon(res.image)
      else setError(res.error)
    } finally {
      setFaviconUploading(false)
    }
  }

  function refreshDomainStatus() {
    const host = activeHost
    if (!host) return
    setDomainStatus({ kind: 'loading' })
    getDomainStatusAction(host).then((res) => {
      if (!res.ok) {
        setDomainStatus({ kind: 'error', message: res.error })
        return
      }
      if ('configured' in res && !res.configured) {
        setDomainStatus({ kind: 'unconfigured' })
        return
      }
      if ('notAttached' in res && res.notAttached) {
        setDomainStatus({ kind: 'not_attached' })
        return
      }
      if ('status' in res) {
        setDomainStatus({
          kind: 'ok',
          verified: res.status.verified,
          misconfigured: res.status.misconfigured,
          recommendedCNAME: res.status.recommendedCNAME,
        })
      }
    })
  }

  function handleAttachDomain() {
    const host = activeHost
    if (!host) return
    setDomainStatus({ kind: 'attaching' })
    attachDomainAction(host).then((res) => {
      if (!res.ok) {
        setDomainStatus({ kind: 'error', message: res.error })
        return
      }
      refreshDomainStatus()
    })
  }

  function handleSubmit() {
    if (!name.trim() || !derivedHost || !displayName.trim()) {
      setError('Name, root domain, and display name are required.')
      return
    }
    const hexFields: Array<[string, string | undefined]> = [
      ['Accent colour', accentColor],
      ['Background colour', backgroundColor],
      ['Text colour', textColor],
      ['Title colour', titleColor],
      ['Body colour', bodyColor],
      ['Navigation colour', navColor],
    ]
    for (const [label, value] of hexFields) {
      if (value && !/^#[0-9a-fA-F]{6}$/.test(value)) {
        setError(`${label} must be a 6-digit hex (e.g. #cf212a).`)
        return
      }
    }
    setError(null)
    setWarning(null)
    const fontOverridesPayload: FontOverrides | undefined =
      fontDisplay || fontDisplayWeight || fontScript || fontScriptWeight ||
      fontBody || fontBodyWeight || fontMono || fontMonoWeight
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
        : undefined
    const input = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      domain: derivedHost,
      displayName: displayName.trim(),
      website: website.trim() || undefined,
      accentColor: accentColor?.trim() || undefined,
      logo: logo ?? null,
      favicon: favicon ?? null,
      // Branding defaults
      theme: theme ?? null,
      backgroundColor: backgroundColor?.trim() || null,
      textColor: textColor?.trim() || null,
      titleColor: titleColor?.trim() || null,
      bodyColor: bodyColor?.trim() || null,
      navColor: navColor?.trim() || null,
      textureImage: textureImage ?? null,
      hideTexture: hideTexture || null,
      // Typography defaults
      eyebrowItalic: eyebrowItalic ?? null,
      eyebrowTransform: eyebrowTransform ?? null,
      titleItalic: titleItalic ?? null,
      titleTransform: titleTransform ?? null,
      fontOverrides: fontOverridesPayload ?? null,
      titleScale: titleScale ?? null,
      eyebrowScale: eyebrowScale ?? null,
      taglineScale: taglineScale ?? null,
    }
    startTransition(async () => {
      if (isEdit) {
        const res = await updateCompanyAction(source!._id, input)
        if (!res.ok) {
          setError(res.error)
          return
        }
        if (res.warning) setWarning(res.warning)
        router.refresh()
        if (res.warning) refreshDomainStatus()
        else onClose()
      } else {
        const res = await createCompanyAction(input)
        if (!res.ok) {
          setError(res.error)
          return
        }
        if (res.warning) setWarning(res.warning)
        router.refresh()
        // Pivot to DNS-setup view in the same modal. Status fetch fires from
        // the activeHost effect now that createdInfo is set.
        setCreatedInfo({ id: res.id, domain: input.domain })
      }
    })
  }

  function handleDelete() {
    if (!source) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const res = await deleteCompanyAction(source._id)
      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        setError(res.error)
        setConfirmDelete(false)
      }
    })
  }

  const logoUrl = logo ? urlForSection(logo, 200) : null
  const faviconUrl = favicon ? urlForSection(favicon, 128) : null

  return (
    <div
      className="add-section-overlay"
      onClick={pending || logoUploading || faviconUploading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit company' : 'New company'}
    >
      <div className="add-section-modal new-brochure-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">
              {createdInfo ? 'Created' : isEdit ? 'Edit' : 'New'}
            </div>
            <h2 className="add-section-modal-title">
              {createdInfo
                ? `${name || 'Company created'} — set up DNS`
                : isEdit
                ? source!.name
                : 'Create a company'}
            </h2>
          </div>
          <button
            type="button"
            className="add-section-close"
            onClick={onClose}
            disabled={pending || logoUploading || faviconUploading}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {!createdInfo ? (
          <FontPreviewLinks slugs={[fontDisplay, fontScript, fontBody, fontMono]} />
        ) : null}
        {!createdInfo ? (
          <nav
            role="tablist"
            aria-label="Company sections"
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 14px 0',
              borderBottom: '1px solid var(--chrome-border)',
            }}
          >
            {COMPANY_TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.key}
                className={`library-filter-pill${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        ) : null}

        <div className="new-brochure-body">
          {createdInfo ? (
            <CreatedSummary
              name={name}
              host={createdInfo.domain}
              displayName={displayName}
              accentColor={accentColor ?? ''}
              logoUrl={logo ? urlForSection(logo, 200) ?? null : null}
            />
          ) : (
          <>
          {activeTab === 'general' ? (
          <>
          <div className="field-group">
            <label className="field-label">Company name</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandstand Tickets"
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="field-label">Hosting domain</label>
            <div className="field-description">
              Default uses the <code>brochures.</code> subdomain on the company&apos;s
              own domain. Switch to custom if GPGT controls DNS for a different
              subdomain (e.g. <code>textbook.grandstandtickets.com</code>).
            </div>
            <div
              role="radiogroup"
              aria-label="Domain mode"
              style={{ display: 'flex', gap: 6, marginBottom: 10 }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={domainMode === 'default'}
                className={`library-filter-pill${domainMode === 'default' ? ' active' : ''}`}
                onClick={() => {
                  if (domainMode === 'default') return
                  // Switching from custom → default: try to populate the root
                  // by stripping the first label of whatever was in custom.
                  if (!rootDomain && customHost) {
                    const labels = customHost.split('.')
                    if (labels.length >= 3) setRootDomain(labels.slice(1).join('.'))
                  }
                  setDomainMode('default')
                }}
              >
                Default — brochures.&lt;root&gt;
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={domainMode === 'custom'}
                className={`library-filter-pill${domainMode === 'custom' ? ' active' : ''}`}
                onClick={() => {
                  if (domainMode === 'custom') return
                  // Switching default → custom: pre-fill the custom field
                  // with the derived host so admin can edit from there.
                  if (!customHost && rootDomain) {
                    setCustomHost(deriveDefaultHost(rootDomain))
                  }
                  setDomainMode('custom')
                }}
              >
                Custom subdomain
              </button>
            </div>
            {domainMode === 'default' ? (
              <input
                className="field-input"
                value={rootDomain}
                onChange={(e) => setRootDomain(e.target.value.toLowerCase())}
                placeholder="grandstandtickets.com"
                spellCheck={false}
              />
            ) : (
              <input
                className="field-input"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value.toLowerCase())}
                placeholder="textbook.grandstandtickets.com"
                spellCheck={false}
              />
            )}
            {derivedHost ? (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  background: 'var(--chrome-raised)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--chrome-text-secondary)',
                }}
              >
                Will host at: <strong style={{ color: 'var(--chrome-text)' }}>{derivedHost}</strong>
              </div>
            ) : null}
          </div>

          <div className="field-group">
            <label className="field-label">Display name</label>
            <div className="field-description">
              Shown on the company&apos;s holding page when no brochure is featured.
            </div>
            <input
              className="field-input"
              value={displayName}
              onChange={(e) => {
                setDisplayNameDirty(true)
                setDisplayName(e.target.value)
              }}
              placeholder="Grandstand Tickets"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Website (optional)</label>
            <input
              className="field-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://grandstandtickets.com"
              spellCheck={false}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Logo (optional)</label>
            <div className="field-description">
              Used in the brochure nav for brochures belonging to this company.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'contain',
                    background: 'var(--chrome-raised)',
                    borderRadius: 6,
                    padding: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: 'var(--chrome-raised)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: 'var(--chrome-text-tertiary)',
                  }}
                >
                  No logo
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="editor-topbar-btn"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading || pending}
                >
                  {logoUploading ? 'Uploading…' : logo ? 'Replace' : 'Upload'}
                </button>
                {logo ? (
                  <button
                    type="button"
                    className="editor-topbar-btn"
                    onClick={() => setLogo(undefined)}
                    disabled={logoUploading || pending}
                  >
                    Remove
                  </button>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Favicon (optional)</label>
            <div className="field-description">
              Browser-tab icon for this company&apos;s brochures and holding page.
              Use a square PNG (128×128 or larger) — non-square images will appear stretched.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: 'contain',
                    background: 'var(--chrome-raised)',
                    borderRadius: 6,
                    padding: 6,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: 'var(--chrome-raised)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--chrome-text-tertiary)',
                  }}
                >
                  None
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="editor-topbar-btn"
                  onClick={() => faviconFileRef.current?.click()}
                  disabled={faviconUploading || pending}
                >
                  {faviconUploading ? 'Uploading…' : favicon ? 'Replace' : 'Upload'}
                </button>
                {favicon ? (
                  <button
                    type="button"
                    className="editor-topbar-btn"
                    onClick={() => setFavicon(undefined)}
                    disabled={faviconUploading || pending}
                  >
                    Remove
                  </button>
                ) : null}
                <input
                  ref={faviconFileRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFaviconFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          </div>
          </>
          ) : null}

          {activeTab === 'branding' ? (
            <CompanyBrandingPanel
              theme={theme}
              setTheme={setTheme}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              textColor={textColor}
              setTextColor={setTextColor}
              titleColor={titleColor}
              setTitleColor={setTitleColor}
              bodyColor={bodyColor}
              setBodyColor={setBodyColor}
              navColor={navColor}
              setNavColor={setNavColor}
              textureImage={textureImage}
              setTextureImage={setTextureImage}
              hideTexture={hideTexture}
              setHideTexture={setHideTexture}
            />
          ) : null}

          {activeTab === 'typography' ? (
            <CompanyTypographyPanel
              titleScale={titleScale}
              setTitleScale={setTitleScale}
              eyebrowScale={eyebrowScale}
              setEyebrowScale={setEyebrowScale}
              taglineScale={taglineScale}
              setTaglineScale={setTaglineScale}
              titleItalic={titleItalic}
              setTitleItalic={setTitleItalic}
              titleTransform={titleTransform}
              setTitleTransform={setTitleTransform}
              eyebrowItalic={eyebrowItalic}
              setEyebrowItalic={setEyebrowItalic}
              eyebrowTransform={eyebrowTransform}
              setEyebrowTransform={setEyebrowTransform}
              fontDisplay={fontDisplay}
              setFontDisplay={setFontDisplay}
              fontDisplayWeight={fontDisplayWeight}
              setFontDisplayWeight={setFontDisplayWeight}
              fontScript={fontScript}
              setFontScript={setFontScript}
              fontScriptWeight={fontScriptWeight}
              setFontScriptWeight={setFontScriptWeight}
              fontBody={fontBody}
              setFontBody={setFontBody}
              fontBodyWeight={fontBodyWeight}
              setFontBodyWeight={setFontBodyWeight}
              fontMono={fontMono}
              setFontMono={setFontMono}
              fontMonoWeight={fontMonoWeight}
              setFontMonoWeight={setFontMonoWeight}
            />
          ) : null}

          {activeTab === 'dns' ? (
            (isEdit || createdInfo) && activeHost ? (
              <div className="field-group">
                <label className="field-label">DNS status</label>
                <DomainStatusBlock
                  status={domainStatus}
                  host={activeHost}
                  onRefresh={refreshDomainStatus}
                  onAttach={handleAttachDomain}
                />
              </div>
            ) : (
              <div
                className="field-description"
                style={{ padding: '20px 4px', textAlign: 'center' }}
              >
                Save the company first — DNS verification appears once the host is attached.
              </div>
            )
          ) : null}
          </>
          )}

          {warning ? (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255, 180, 0, 0.08)',
                border: '1px solid rgba(255, 180, 0, 0.3)',
                borderRadius: 6,
                color: '#ffcb66',
                fontSize: 12,
              }}
            >
              ⚠ {warning}
            </div>
          ) : null}
          {error ? <div className="field-error">{error}</div> : null}
        </div>

        <footer className="new-brochure-footer">
          {createdInfo ? (
            <button
              className="editor-topbar-btn primary"
              onClick={onClose}
              style={{ marginLeft: 'auto' }}
            >
              Done
            </button>
          ) : (
            <>
              {isEdit ? (
                <button
                  className="editor-topbar-btn"
                  onClick={handleDelete}
                  disabled={pending || logoUploading || faviconUploading}
                  style={{ marginRight: 'auto', color: '#cf212a' }}
                >
                  {confirmDelete ? 'Click again to confirm' : 'Delete'}
                </button>
              ) : null}
              <button
                className="editor-topbar-btn"
                onClick={onClose}
                disabled={pending || logoUploading || faviconUploading}
              >
                Cancel
              </button>
              <button
                className="editor-topbar-btn primary"
                onClick={handleSubmit}
                disabled={pending || logoUploading || faviconUploading}
              >
                {pending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save' : 'Create'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

/**
 * Renders the Vercel DNS verification state with a "Refresh" button.
 * Pending = DNS not yet pointing at Vercel; user needs to add a CNAME.
 */
function DomainStatusBlock({
  status,
  host,
  onRefresh,
  onAttach,
}: {
  status: DomainStatusState
  host: string
  onRefresh: () => void
  onAttach: () => void
}) {
  const subdomain = host.split('.')[0] || 'brochures'
  const baseStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.5,
  }

  if (status.kind === 'idle' || status.kind === 'loading') {
    return (
      <div style={{ ...baseStyle, background: 'var(--chrome-raised)', color: 'var(--chrome-text-tertiary)' }}>
        Checking DNS…
      </div>
    )
  }
  if (status.kind === 'attaching') {
    return (
      <div style={{ ...baseStyle, background: 'var(--chrome-raised)', color: 'var(--chrome-text-tertiary)' }}>
        Attaching to Vercel…
      </div>
    )
  }
  if (status.kind === 'not_attached') {
    return (
      <div
        style={{
          ...baseStyle,
          background: 'rgba(255, 180, 0, 0.06)',
          border: '1px solid rgba(255, 180, 0, 0.25)',
          color: 'var(--chrome-text-secondary)',
        }}
      >
        <div style={{ color: '#ffcb66', marginBottom: 6 }}>
          ⚠ Not attached to Vercel
        </div>
        <div style={{ marginBottom: 8 }}>
          This domain isn&apos;t on the Vercel project yet — likely because the
          Vercel API env vars weren&apos;t set when the company was created.
        </div>
        <button
          type="button"
          className="editor-topbar-btn primary"
          onClick={onAttach}
          style={{ fontSize: 11 }}
        >
          Attach now
        </button>
      </div>
    )
  }
  if (status.kind === 'unconfigured') {
    return (
      <div style={{ ...baseStyle, background: 'var(--chrome-raised)', color: 'var(--chrome-text-secondary)' }}>
        Vercel API not configured. Set <code>VERCEL_API_TOKEN</code> + <code>VERCEL_PROJECT_ID</code> to
        manage domains automatically.
      </div>
    )
  }
  if (status.kind === 'error') {
    return (
      <div
        style={{
          ...baseStyle,
          background: 'rgba(225, 6, 0, 0.08)',
          border: '1px solid rgba(225, 6, 0, 0.3)',
          color: '#ff8a80',
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <strong>Vercel error:</strong> {status.message}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 11 }}
        >
          Retry status check
        </button>
      </div>
    )
  }
  if (status.verified && !status.misconfigured) {
    return (
      <div
        style={{
          ...baseStyle,
          background: 'rgba(0, 200, 100, 0.08)',
          border: '1px solid rgba(0, 200, 100, 0.3)',
          color: '#7ee2a8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>✓ Verified — DNS pointed correctly, SSL active.</span>
        <button
          type="button"
          onClick={onRefresh}
          style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 11 }}
        >
          Refresh
        </button>
      </div>
    )
  }
  // Either misconfigured or not yet verified — show CNAME instructions.
  const cname = status.recommendedCNAME ?? 'cname.vercel-dns.com'
  return (
    <div
      style={{
        ...baseStyle,
        background: 'rgba(255, 180, 0, 0.06)',
        border: '1px solid rgba(255, 180, 0, 0.25)',
        color: 'var(--chrome-text-secondary)',
      }}
    >
      <div style={{ color: '#ffcb66', marginBottom: 6 }}>
        ⚠ DNS pending — domain attached to Vercel but not yet pointed.
      </div>
      <div style={{ marginBottom: 8 }}>
        Add this record at the customer&apos;s DNS provider:
      </div>
      <div
        style={{
          background: 'var(--chrome-bg)',
          padding: '10px 12px',
          borderRadius: 4,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: 'var(--chrome-text)',
          display: 'grid',
          gridTemplateColumns: '60px 1fr auto',
          rowGap: 6,
          columnGap: 10,
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--chrome-text-tertiary)' }}>Type</span>
        <strong>CNAME</strong>
        <span />
        <span style={{ color: 'var(--chrome-text-tertiary)' }}>Name</span>
        <strong style={{ overflowWrap: 'anywhere' }}>{subdomain}</strong>
        <CopyButton value={subdomain} />
        <span style={{ color: 'var(--chrome-text-tertiary)' }}>Value</span>
        <strong style={{ overflowWrap: 'anywhere' }}>{cname}</strong>
        <CopyButton value={cname} />
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--chrome-text-tertiary)' }}>
          Auto-checks every 10s — verifies as soon as the record propagates.
        </span>
        <button
          type="button"
          onClick={onRefresh}
          style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 11 }}
        >
          Check now
        </button>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {
          /* ignore */
        }
      }}
      style={{
        background: 'var(--chrome-raised)',
        border: '1px solid var(--chrome-border)',
        color: 'var(--chrome-text-secondary)',
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 10,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function CreatedSummary({
  name,
  host,
  displayName,
  accentColor,
  logoUrl,
}: {
  name: string
  host: string
  displayName: string
  accentColor: string
  logoUrl: string | null
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '12px 14px',
        background: 'rgba(0, 200, 100, 0.06)',
        border: '1px solid rgba(0, 200, 100, 0.25)',
        borderRadius: 8,
        marginBottom: 4,
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: 44,
            height: 44,
            objectFit: 'contain',
            background: 'var(--chrome-raised)',
            borderRadius: 6,
            padding: 4,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            background: accentColor || 'var(--chrome-raised)',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--chrome-text)' }}>
          {displayName || name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--chrome-text-secondary)', overflowWrap: 'anywhere' }}>
          {host}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#7ee2a8', whiteSpace: 'nowrap' }}>✓ Saved</div>
    </div>
  )
}

// ── Branding panel ──────────────────────────────────────────────────────

type CompanyBrandingPanelProps = {
  theme: BrochureTheme | undefined
  setTheme: (v: BrochureTheme | undefined) => void
  accentColor: string | undefined
  setAccentColor: (v: string | undefined) => void
  backgroundColor: string | undefined
  setBackgroundColor: (v: string | undefined) => void
  textColor: string | undefined
  setTextColor: (v: string | undefined) => void
  titleColor: string | undefined
  setTitleColor: (v: string | undefined) => void
  bodyColor: string | undefined
  setBodyColor: (v: string | undefined) => void
  navColor: string | undefined
  setNavColor: (v: string | undefined) => void
  textureImage: SanityImage | undefined
  setTextureImage: (v: SanityImage | undefined) => void
  hideTexture: boolean
  setHideTexture: (v: boolean) => void
}

function CompanyBrandingPanel(props: CompanyBrandingPanelProps) {
  const {
    theme, setTheme,
    accentColor, setAccentColor,
    backgroundColor, setBackgroundColor,
    textColor, setTextColor,
    titleColor, setTitleColor,
    bodyColor, setBodyColor,
    navColor, setNavColor,
    textureImage, setTextureImage,
    hideTexture, setHideTexture,
  } = props
  const themeDisabled = Boolean(titleColor || textColor || backgroundColor || navColor)
  return (
    <>
      <div className="settings-section-header">Theme</div>
      <div
        className="editor-icon-segment brochure-theme-toggle"
        role="group"
        aria-label="Default theme"
        aria-disabled={themeDisabled}
      >
        <button
          type="button"
          className={`editor-icon-segment-btn ${theme === 'dark' ? 'active' : ''}`.trim()}
          onClick={() => setTheme(theme === 'dark' ? undefined : 'dark')}
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
          onClick={() => setTheme(theme === 'light' ? undefined : 'light')}
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
          : 'Default Title, Text, Background, and Navigation colours for brochures of this company.'}
      </div>

      <div className="settings-section-header">Brand colours</div>
      <div className="brand-colors-compact">
        <FieldColor
          label="Accent"
          value={accentColor}
          onChange={setAccentColor}
          fallback="#cf212a"
        />
        <FieldColor
          label="Title"
          value={titleColor}
          onChange={setTitleColor}
          fallback={theme === 'light' ? '#161618' : '#ffffff'}
        />
        <FieldColor
          label="Text"
          value={textColor}
          onChange={setTextColor}
          fallback={theme === 'light' ? '#161618' : '#ffffff'}
        />
        <FieldColor
          label="Body"
          value={bodyColor}
          onChange={setBodyColor}
          fallback={theme === 'light' ? '#161618' : '#ffffff'}
        />
        <FieldColor
          label="Background"
          value={backgroundColor}
          onChange={setBackgroundColor}
          fallback={theme === 'light' ? '#f6f5f1' : '#161618'}
        />
        <FieldColor
          label="Navigation"
          value={navColor}
          onChange={setNavColor}
          fallback="#161618"
        />
      </div>

      <div className="settings-section-header">Background</div>
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
            description="Default halftone-style texture across all textured sections."
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
  )
}

// ── Typography panel ────────────────────────────────────────────────────

type CompanyTypographyPanelProps = {
  titleScale: TextScalePreset | undefined
  setTitleScale: (v: TextScalePreset | undefined) => void
  eyebrowScale: TextScalePreset | undefined
  setEyebrowScale: (v: TextScalePreset | undefined) => void
  taglineScale: TextScalePreset | undefined
  setTaglineScale: (v: TextScalePreset | undefined) => void
  titleItalic: boolean | undefined
  setTitleItalic: (v: boolean | undefined) => void
  titleTransform: string | undefined
  setTitleTransform: (v: string | undefined) => void
  eyebrowItalic: boolean | undefined
  setEyebrowItalic: (v: boolean | undefined) => void
  eyebrowTransform: string | undefined
  setEyebrowTransform: (v: string | undefined) => void
  fontDisplay: string | undefined
  setFontDisplay: (v: string | undefined) => void
  fontDisplayWeight: string | undefined
  setFontDisplayWeight: (v: string | undefined) => void
  fontScript: string | undefined
  setFontScript: (v: string | undefined) => void
  fontScriptWeight: string | undefined
  setFontScriptWeight: (v: string | undefined) => void
  fontBody: string | undefined
  setFontBody: (v: string | undefined) => void
  fontBodyWeight: string | undefined
  setFontBodyWeight: (v: string | undefined) => void
  fontMono: string | undefined
  setFontMono: (v: string | undefined) => void
  fontMonoWeight: string | undefined
  setFontMonoWeight: (v: string | undefined) => void
}

function CompanyTypographyPanel(props: CompanyTypographyPanelProps) {
  const {
    titleScale, setTitleScale,
    eyebrowScale, setEyebrowScale,
    taglineScale, setTaglineScale,
    titleItalic, setTitleItalic,
    titleTransform, setTitleTransform,
    eyebrowItalic, setEyebrowItalic,
    eyebrowTransform, setEyebrowTransform,
    fontDisplay, setFontDisplay,
    fontDisplayWeight, setFontDisplayWeight,
    fontScript, setFontScript,
    fontScriptWeight, setFontScriptWeight,
    fontBody, setFontBody,
    fontBodyWeight, setFontBodyWeight,
    fontMono, setFontMono,
    fontMonoWeight, setFontMonoWeight,
  } = props
  return (
    <>
      <div className="settings-section-header">Type scale</div>
      <FieldSelect
        label="Title"
        description="Default scale for headline and title text."
        value={titleScale ?? 'm'}
        onChange={(v) => setTitleScale(v === 'm' ? undefined : (v as TextScalePreset))}
        options={SCALE_OPTIONS}
      />
      <FieldSelect
        label="Eyebrow"
        description="Default scale for eyebrow text."
        value={eyebrowScale ?? 'm'}
        onChange={(v) => setEyebrowScale(v === 'm' ? undefined : (v as TextScalePreset))}
        options={SCALE_OPTIONS}
      />
      <FieldSelect
        label="Body text"
        description="Default scale for body, tagline, and subtitle text."
        value={taglineScale ?? 'm'}
        onChange={(v) => setTaglineScale(v === 'm' ? undefined : (v as TextScalePreset))}
        options={SCALE_OPTIONS}
      />

      <div className="settings-section-header">Fonts</div>
      <FontCard
        role="display"
        label="Title"
        description="Headlines and display text"
        previewText="Monaco Grand Prix"
        previewSize={28}
        previewItalic={titleItalic ?? false}
        previewUppercase={titleTransform === 'uppercase' || titleTransform === undefined}
        previewTransform={titleTransform ?? 'uppercase'}
        fontSlug={fontDisplay}
        fontWeight={fontDisplayWeight}
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
        description="Eyebrow and accent text"
        previewText="A weekend of speed"
        previewSize={26}
        previewItalic={eyebrowItalic ?? true}
        previewUppercase={eyebrowTransform === 'uppercase'}
        previewTransform={eyebrowTransform}
        fontSlug={fontScript}
        fontWeight={fontScriptWeight}
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
        onFontChange={(v) => { setFontMono(v || undefined); setFontMonoWeight(undefined) }}
        onWeightChange={(v) => setFontMonoWeight(v || undefined)}
      />
    </>
  )
}
