'use client'

import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  description?: string
  value: string[] | undefined
  onChange: (value: string[]) => void
  placeholder?: string
  addLabel?: string
}

/**
 * Editor for a simple array of strings — e.g. package features or gallery captions.
 * Each row: text input + remove button + up/down reorder.
 * Also has an "Add item" button beneath.
 */
export function FieldList({
  label,
  description,
  value,
  onChange,
  placeholder,
  addLabel = '+ Add item',
}: Props) {
  const items = value ?? []

  function update(index: number, next: string) {
    const copy = [...items]
    copy[index] = next
    onChange(copy)
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const copy = [...items]
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    onChange(copy)
  }
  function add() {
    onChange([...items, ''])
  }

  return (
    <FieldLabel label={label} description={description}>
      <div className="field-list">
        {items.map((item, i) => (
          <div key={i} className="field-list-row">
            <input
              type="text"
              className="field-input field-list-input"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
            />
            <div className="field-list-row-actions">
              <button
                type="button"
                className="field-icon-btn"
                aria-label="Move up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                type="button"
                className="field-icon-btn"
                aria-label="Move down"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button
                type="button"
                className="field-icon-btn danger"
                aria-label="Remove"
                onClick={() => remove(i)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="field-list-add" onClick={add}>
          {addLabel}
        </button>
      </div>
    </FieldLabel>
  )
}
