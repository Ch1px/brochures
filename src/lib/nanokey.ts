/**
 * Generate a Sanity-compatible _key for a new array item.
 * Sanity auto-generates _key on save via autoGenerateArrayKeys, but
 * we need stable keys in client state before the save round-trip so
 * React can reconcile list items without remounting on every edit.
 *
 * Format matches Sanity's internal style: 12-char lowercase alphanumeric.
 */
export function nanokey(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

/**
 * Deep-clone any value, replacing every `_key` string property with a fresh
 * `nanokey()`. Used to duplicate pages or sections without colliding with the
 * source's array item ids in Sanity. Walks plain objects and arrays; leaves
 * primitives, refs, and other shapes untouched.
 */
export function cloneWithNewKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => cloneWithNewKeys(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = k === '_key' && typeof v === 'string' ? nanokey() : cloneWithNewKeys(v)
    }
    return out as T
  }
  return value
}
