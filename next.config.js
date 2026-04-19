/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  experimental: {
    taint: true,
    // Raise the default 1MB server-action limit so image uploads
    // (photos often 5–15MB) don't get rejected at the framework boundary.
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

module.exports = nextConfig
