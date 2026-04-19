'use client'

import { useRef, useState } from 'react'
import type { SectionCircuitMap, StatItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { themeCircuitSvg } from '@/lib/themeCircuitSvg'
import { FieldInput, FieldTextarea, FieldObjectArray, FieldLabel } from '../fields'

type Props = {
  section: SectionCircuitMap
  onChange: (update: Partial<SectionCircuitMap>) => void
}

export function CircuitMapEditor({ section, onChange }: Props) {
  const svgInputRef = useRef<HTMLInputElement>(null)
  const [svgError, setSvgError] = useState<string | null>(null)
  const [svgLoading, setSvgLoading] = useState(false)

  async function handleSvgFile(file: File) {
    setSvgError(null)
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setSvgError('File must be an SVG')
      return
    }
    setSvgLoading(true)
    try {
      const text = await file.text()
      if (!text.includes('<svg')) {
        setSvgError('File does not contain an <svg> element')
        return
      }
      // Run the palette remap so the circuit fits the dark brochure theme.
      const themed = themeCircuitSvg(text)
      onChange({ svg: themed })
    } catch (err) {
      setSvgError(err instanceof Error ? err.message : 'Could not read SVG')
    } finally {
      setSvgLoading(false)
    }
  }

  return (
    <>
      <FieldInput
        label="Eyebrow"
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldInput
        label="Title"
        description="Circuit name, e.g. “Circuit de Monaco”."
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldTextarea
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        rows={2}
      />

      <FieldLabel
        label="Circuit SVG"
        description="Upload an SVG and the palette is auto-remapped to the brochure theme (brand red + whites). You can also paste the themed XML directly into the textarea below."
      >
        <div className="field-svg-upload">
          <button
            type="button"
            className="field-btn"
            onClick={() => svgInputRef.current?.click()}
            disabled={svgLoading}
          >
            {svgLoading
              ? 'Reading…'
              : section.svg && section.svg.trim().length > 0
                ? 'Replace SVG'
                : 'Upload SVG'}
          </button>
          {section.svg && section.svg.trim().length > 0 ? (
            <button
              type="button"
              className="field-btn field-btn-ghost"
              onClick={() => onChange({ svg: '' })}
            >
              Clear
            </button>
          ) : null}
          <input
            ref={svgInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleSvgFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {svgError ? <div className="field-error">{svgError}</div> : null}
        <textarea
          className="field-textarea field-svg-textarea"
          value={section.svg ?? ''}
          onChange={(e) => onChange({ svg: e.target.value })}
          rows={6}
          placeholder="<svg>…</svg>"
          spellCheck={false}
        />
      </FieldLabel>

      <FieldObjectArray<StatItem>
        label="Stats"
        description="Up to 3 stats show beneath the map."
        value={section.stats}
        onChange={(stats) => onChange({ stats })}
        maxItems={3}
        addLabel="+ Add stat"
        itemTitle={(i, it) => (it.label ? it.label : `Stat ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({ _key: nanokey(), value: '', unit: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <FieldInput
              label="Value"
              value={stat.value}
              onChange={(value) => update({ value })}
            />
            <FieldInput
              label="Unit"
              value={stat.unit}
              onChange={(unit) => update({ unit })}
            />
            <FieldInput
              label="Label"
              value={stat.label}
              onChange={(label) => update({ label })}
            />
          </>
        )}
      />
    </>
  )
}
