import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const assetsBaseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.replace(
  /\/$/,
  ''
)

if (!assetsBaseUrl) {
  throw new Error('NEXT_PUBLIC_ASSETS_BASE_URL is not set')
}

const assetsHostname = new URL(assetsBaseUrl).hostname

const portfolioHeaders = [
  { key: 'Cache-Control', value: 'private, no-store' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: assetsHostname,
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/schematic-visualization/portfolio',
        headers: portfolioHeaders,
      },
      {
        source: '/ar/schematic-visualization/portfolio',
        headers: portfolioHeaders,
      },
      {
        source: '/he/schematic-visualization/portfolio',
        headers: portfolioHeaders,
      },
    ]
  },
  // Proxy GLB/assets so the browser can load them without S3 CORS.
  async rewrites() {
    return [
      {
        source: '/s3/:path*',
        destination: `${assetsBaseUrl}/:path*`,
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
