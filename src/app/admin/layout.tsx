import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider'
import './brochures/[id]/edit/editor.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-admin',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

/**
 * Admin layout — double-gate on top of middleware:
 * 1. Middleware ensures the user is signed in (or redirects to Clerk login).
 * 2. This layout additionally checks the user's email is in the allowlist.
 *    If not, responds 404 rather than 403 — less information leaked to intruders.
 *
 * Allowlist is comma-separated in ADMIN_EMAIL_ALLOWLIST env var.
 *
 * Wraps in AdminThemeProvider so the dark/light chrome preference applies
 * across every admin page (editor, library, companies, media). The provider
 * adds `data-admin-theme` to <html> on mount and removes it on unmount, so
 * public routes (/[slug]) never see the attribute.
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

  return (
    <AdminThemeProvider>
      <div className={`admin-app ${outfit.variable}`}>{children}</div>
    </AdminThemeProvider>
  )
}
