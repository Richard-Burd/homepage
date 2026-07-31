import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'richard-burd-homepage.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // Proxy GLB/assets so the browser can load them without S3 CORS.
  async rewrites() {
    return [
      {
        source: '/s3/:path*',
        destination:
          'https://richard-burd-homepage.s3.us-east-1.amazonaws.com/:path*',
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
