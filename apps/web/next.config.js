/** @type {import('next').NextConfig} */
const path = require('path');

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

module.exports = nextConfig;
