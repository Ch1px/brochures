import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { EasterEgg } from '@/components/EasterEgg'
import './globals.css'

// metadataBase is intentionally not set here — per-page metadata in
// `/[slug]/page.tsx` resolves it from the request host so canonical URLs and
// og:image absolute URLs match the host serving the request (canonical or
// child-company subdomain).
export const metadata: Metadata = {
  title: {
    default: 'Grand Prix Grand Tours · Brochures',
    template: '%s · Grand Prix Grand Tours',
  },
  description: 'Formula 1 hospitality brochures from Grand Prix Grand Tours.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <EasterEgg />
        </body>
      </html>
    </ClerkProvider>
  )
}
