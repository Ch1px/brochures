'use client'

import { useState, type ReactNode } from 'react'
import { FieldLabel } from './FieldLabel'

type ItemWithKey = { _key: string }

type Props<T extends ItemWithKey> = {
  label: string
  description?: string
  value: T[] | undefined
  onChange: (value: T[]) => void
  renderItem: (item: T, update: (partial: Partial<T>) => void, index: number) => ReactNode
  createNew: () => T
  /** Shown in each item's card header; receives index + item. Defaults to "Item NN". */
  itemTitle?: (index: number, item: T) => string
  /** Optional cap on items; disables the Add button once reached. */
  maxItems?: number
  addLabel?: string
}

/**
 * Generic array-of-objects editor. Renders each item in a card with its own
 * reorder/remove actions, plus a single "Add" button at the bottom.
 *
 * Type-parametric — each editor passes a narrower T for its specific shape.
 */
export function FieldObjectArray<T extends ItemWithKey>({
  label,
  description,
  value,
  onChange,
  renderItem,
  createNew,
  itemTitle,
  maxItems,
  addLabel = '+ Add item',
}: Props<T>) {
  const items = value ?? []
  const atMax = typeof maxItems === 'number' && items.length >= maxItems
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const toggle = (key: string) => setExpandedKey((cur) => (cur === key ? null : key))

  function update(index: number, partial: Partial<T>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...partial } : it)))
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
    if (atMax) return
    const next = createNew()
    onChange([...items, next])
    setExpandedKey(next._key)
  }

  return (
    <FieldLabel label={label} description={description}>
      <div className="field-object-array">
        {items.map((item, i) => {
          const isOpen = expandedKey === item._key
          return (
          <div key={item._key} className={`field-object-card${isOpen ? ' open' : ''}`}>
            <div
              className="field-object-card-header"
              onClick={() => toggle(item._key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(item._key)
                }
              }}
            >
              <span className={`field-object-card-chevron${isOpen ? ' open' : ''}`} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </span>
              <span className="field-object-card-title">
                {itemTitle ? itemTitle(i, item) : `Item ${String(i + 1).padStart(2, '0')}`}
              </span>
              <div className="field-object-card-actions" onClick={(e) => e.stopPropagation()}>
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
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
            {isOpen ? (
              <div className="field-object-card-body">
                {renderItem(item, (p) => update(i, p), i)}
              </div>
            ) : null}
          </div>
          )
        })}
        <button
          type="button"
          className="field-list-add"
          onClick={add}
          disabled={atMax}
        >
          {atMax ? `At max (${maxItems})` : addLabel}
        </button>
      </div>
    </FieldLabel>
  )
}
