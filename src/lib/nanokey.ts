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
