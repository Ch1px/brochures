/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  experimental: {
    taint: true,
  },
  // Raise the default 1MB server-action body limit so image and video
  // uploads (videos can be 20–40MB compressed) aren't rejected at the
  // framework boundary. In Next 15+ this lives at the top level, not under
  // experimental — putting it under experimental silently does nothing.
  serverActions: {
    bodySizeLimit: '50mb',
  },
}

module.exports = nextConfig
