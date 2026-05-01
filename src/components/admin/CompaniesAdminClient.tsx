'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CompanyEditModal, type CompanyFormSource } from './CompanyEditModal'
import { urlForSection } from '@/lib/sanity/image'
import type {
  BrochureTheme,
  FontOverrides,
  SanityImage,
  TextScalePreset,
} from '@/types/brochure'

export type CompanyRow = {
  _id: string
  name: string
  slug?: string
  domain: string
  displayName: string
  website?: string
  accentColor?: string
  logo?: SanityImage
  favicon?: SanityImage
  brochureCount: number
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

type Props = {
  companies: CompanyRow[]
}

export function CompaniesAdminClient({ companies }: Props) {
  const [newOpen, setNewOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CompanyFormSource | null>(null)

  return (
    <>
      <div className="library-header">
        <div className="library-header-titleblock">
          <h1 className="library-title">Companies</h1>
          <span className="library-title-count">{companies.length}</span>
        </div>
        <div className="library-header-actions">
          <button className="library-header-btn primary" onClick={() => setNewOpen(true)}>
            <Plus size={15} strokeWidth={2.4} />
            <span>New company</span>
          </button>
        </div>
      </div>

      <div className="library-body">
        {companies.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-title">No companies yet</div>
            <button className="library-empty-reset" onClick={() => setNewOpen(true)}>
              Create your first
            </button>
          </div>
        ) : (
          <div className="library-grid">
            {companies.map((c) => {
              const logoUrl = c.logo ? urlForSection(c.logo, 200) : null
              return (
                <button
                  key={c._id}
                  className="library-card company-card"
                  onClick={() =>
                    setEditTarget({
                      _id: c._id,
                      name: c.name,
                      slug: c.slug,
                      domain: c.domain,
                      displayName: c.displayName,
                      website: c.website,
                      accentColor: c.accentColor,
                      logo: c.logo,
                      favicon: c.favicon,
                      theme: c.theme,
                      backgroundColor: c.backgroundColor,
                      textColor: c.textColor,
                      titleColor: c.titleColor,
                      bodyColor: c.bodyColor,
                      navColor: c.navColor,
                      textureImage: c.textureImage,
                      hideTexture: c.hideTexture,
                      eyebrowItalic: c.eyebrowItalic,
                      eyebrowTransform: c.eyebrowTransform,
                      titleItalic: c.titleItalic,
                      titleTransform: c.titleTransform,
                      fontOverrides: c.fontOverrides,
                      titleScale: c.titleScale,
                      eyebrowScale: c.eyebrowScale,
                      taglineScale: c.taglineScale,
                    })
                  }
                >
                  <div className="company-card-thumb">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="" className="company-card-logo" />
                    ) : (
                      <div className="company-card-monogram">{c.name.charAt(0).toUpperCase()}</div>
                    )}
                    {c.accentColor ? (
                      <span
                        className="company-card-accent-dot"
                        style={{ background: c.accentColor }}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="library-card-body">
                    <div className="library-card-title">{c.name}</div>
                    <div className="library-card-meta">
                      <span className="company-card-domain">{c.domain}</span>
                      <span className="library-card-meta-sep" aria-hidden>·</span>
                      <span>
                        {c.brochureCount} brochure{c.brochureCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <CompanyEditModal open={newOpen} onClose={() => setNewOpen(false)} />
      <CompanyEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        source={editTarget ?? undefined}
      />
    </>
  )
}
