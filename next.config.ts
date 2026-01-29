import type { NextConfig } from 'next'

const nextConfig: NextConfig = { 
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        'redesigned-pancake-44grvqpqwx4fjgr4-3000.app.github.dev',
        '*.app.github.dev'
      ]
    }
  }
}

export default nextConfig
