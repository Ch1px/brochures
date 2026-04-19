/**
 * Runtime env var access. Throws clearly if a required key is missing.
 * Usage:
 *   const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
 */

export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Set it in .env.local (dev) or in your Vercel project settings (production).`
    )
  }
  return value
}

export function optionalEnv(key: string): string | undefined {
  const value = process.env[key]
  return value && value.length > 0 ? value : undefined
}
