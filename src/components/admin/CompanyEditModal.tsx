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
import type { SanityImage } from '@/types/brochure'

export type CompanyFormSource = {
  _id: string
  name: string
  slug?: string
  domain: string
  displayName: string
  website?: string
  accentColor?: string
  logo?: SanityImage
}

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
  const [accentColor, setAccentColor] = useState('')
  const [logo, setLogo] = useState<SanityImage | undefined>(undefined)
  const [logoUploading, setLogoUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [domainStatus, setDomainStatus] = useState<DomainStatusState>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const derivedHost =
    domainMode === 'default' ? deriveDefaultHost(rootDomain) : cleanHost(customHost)

  useEffect(() => {
    if (!open) {
      setName('')
      setSlug('')
      setSlugDirty(false)
      setDomainMode('default')
      setRootDomain('')
      setCustomHost('')
      setDisplayName('')
      setDisplayNameDirty(false)
      setWebsite('')
      setAccentColor('')
      setLogo(undefined)
      setError(null)
      setWarning(null)
      setConfirmDelete(false)
      setDomainStatus({ kind: 'idle' })
      return
    }
    if (source) {
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
      setAccentColor(source.accentColor ?? '')
      setLogo(source.logo)
    }
  }, [open, source])

  // Auto-derive slug + displayName from name unless edited manually.
  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name))
  }, [name, slugDirty])
  useEffect(() => {
    if (!displayNameDirty) setDisplayName(name)
  }, [name, displayNameDirty])

  // In edit mode, fetch DNS status when the modal opens.
  useEffect(() => {
    if (!open || !source) return
    setDomainStatus({ kind: 'loading' })
    getDomainStatusAction(source.domain).then((res) => {
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
  }, [open, source])

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

  function refreshDomainStatus() {
    const host = source?.domain
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
    const host = source?.domain
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
    if (accentColor && !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
      setError('Accent colour must be a 6-digit hex (e.g. #e10600).')
      return
    }
    setError(null)
    setWarning(null)
    const input = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      domain: derivedHost,
      displayName: displayName.trim(),
      website: website.trim() || undefined,
      accentColor: accentColor.trim() || undefined,
      logo: logo ?? null,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateCompanyAction(source!._id, input)
        : await createCompanyAction(input)
      if (res.ok) {
        if (res.warning) {
          setWarning(res.warning)
          // Refresh status so the user can see DNS state immediately.
          if (isEdit) refreshDomainStatus()
          // Don't auto-close — let the admin read the warning.
          router.refresh()
        } else {
          router.refresh()
          onClose()
        }
      } else {
        setError(res.error)
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

  return (
    <div
      className="add-section-overlay"
      onClick={pending || logoUploading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit company' : 'New company'}
    >
      <div className="add-section-modal new-brochure-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">{isEdit ? 'Edit' : 'New'}</div>
            <h2 className="add-section-modal-title">
              {isEdit ? source!.name : 'Create a company'}
            </h2>
          </div>
          <button
            type="button"
            className="add-section-close"
            onClick={onClose}
            disabled={pending || logoUploading}
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

          {isEdit ? (
            <div className="field-group">
              <label className="field-label">DNS status</label>
              <DomainStatusBlock
                status={domainStatus}
                host={source!.domain}
                onRefresh={refreshDomainStatus}
                onAttach={handleAttachDomain}
              />
            </div>
          ) : null}

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

          <div className="new-brochure-row">
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
              <label className="field-label">Accent colour (optional)</label>
              <input
                className="field-input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#e10600"
                spellCheck={false}
              />
            </div>
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
          {isEdit ? (
            <button
              className="editor-topbar-btn"
              onClick={handleDelete}
              disabled={pending || logoUploading}
              style={{ marginRight: 'auto', color: '#e10600' }}
            >
              {confirmDelete ? 'Click again to confirm' : 'Delete'}
            </button>
          ) : null}
          <button
            className="editor-topbar-btn"
            onClick={onClose}
            disabled={pending || logoUploading}
          >
            Cancel
          </button>
          <button
            className="editor-topbar-btn primary"
            onClick={handleSubmit}
            disabled={pending || logoUploading}
          >
            {pending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save' : 'Create'}
          </button>
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
          padding: '8px 10px',
          borderRadius: 4,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: 'var(--chrome-text)',
        }}
      >
        Type: <strong>CNAME</strong>
        <br />
        Name: <strong>{subdomain}</strong>
        <br />
        Value: <strong>{cname}</strong>
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onRefresh}
          style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 11 }}
        >
          Refresh status
        </button>
      </div>
    </div>
  )
}
