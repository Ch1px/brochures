import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Grand Prix Grand Tours · Brochures',
    template: '%s · Grand Prix Grand Tours',
  },
  description: 'Formula 1 hospitality brochures from Grand Prix Grand Tours.',
  metadataBase: new URL('https://brochures.grandprixgrandtours.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
