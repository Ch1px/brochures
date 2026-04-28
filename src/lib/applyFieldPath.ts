import type { Section } from '@/types/brochure'

/**
 * Immutably update a nested field on a Section given a dot-separated path.
 *
 *   applyFieldPath(section, "title", "New Title")         → top-level
 *   applyFieldPath(section, "stats.2.label", "Length")     → array item field
 *   applyFieldPath(section, "captions.0", "Harbor view")   → array value
 */
export function applyFieldPath(section: Section, path: string, value: string): Section {
  const parts = path.split('.')

  // Top-level field
  if (parts.length === 1) {
    return { ...section, [parts[0]]: value } as Section
  }

  // Array direct value: "captions.0"
  if (parts.length === 2) {
    const [arrayField, indexStr] = parts
    const index = parseInt(indexStr, 10)
    if (!isNaN(index)) {
      const arr = [...((section as Record<string, unknown>)[arrayField] as unknown[] ?? [])]
      arr[index] = value
      return { ...section, [arrayField]: arr } as Section
    }
    return section
  }

  // Array item field: "stats.2.label"
  if (parts.length === 3) {
    const [arrayField, indexStr, field] = parts
    const index = parseInt(indexStr, 10)
    const arr = (section as Record<string, unknown>)[arrayField]
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) return section
    const updatedArr = arr.map((item: Record<string, unknown>, i: number) =>
      i === index ? { ...item, [field]: value } : item
    )
    return { ...section, [arrayField]: updatedArr } as Section
  }

  return section
}
