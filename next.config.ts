import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    // Temporary workaround for Next.js type generation bug
    // that generates incorrect paths (src/app instead of app)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
}

export default withNextIntl(nextConfig)
