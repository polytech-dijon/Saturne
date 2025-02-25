import type { NextConfig } from 'next';

const parsedUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: parsedUrl.hostname,
        pathname: '/api/uploads/**',
      },
    ],
  },
};

export default nextConfig;
