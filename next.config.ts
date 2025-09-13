import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://example.com';
const parsedUrl = new URL(API_URL);

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: parsedUrl.hostname,
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'media.divia.fr',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/posters',
        permanent: true,
      },
    ];
  },

};

export default nextConfig;
