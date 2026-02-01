/** @type {import('next').NextConfig} */
const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Required for mobile compatibility
    unoptimized: true,
  },
  
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
};

module.exports = withNextIntl(nextConfig);
