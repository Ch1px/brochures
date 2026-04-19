'use client'

/**
 * Sanity Studio embedded inside the Next.js app at /studio.
 * Protected by Clerk middleware — only allowlisted admins can access.
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export default function StudioPage() {
  return <NextStudio config={config} />
}
