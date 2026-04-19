import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

/**
 * Admin layout — double-gate on top of middleware:
 * 1. Middleware ensures the user is signed in (or redirects to Clerk login).
 * 2. This layout additionally checks the user's email is in the allowlist.
 *    If not, responds 404 rather than 403 — less information leaked to intruders.
 *
 * Allowlist is comma-separated in ADMIN_EMAIL_ALLOWLIST env var.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress

  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (!email || !allowlist.includes(email.toLowerCase())) {
    notFound()
  }

  return <>{children}</>
}
