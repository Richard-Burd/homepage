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
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
