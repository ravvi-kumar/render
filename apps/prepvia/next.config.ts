import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'prepvia.s3.ap-south-1.amazonaws.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  async rewrites() {
    return [
      {
        source: '/api/:path*)',
        destination: `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:8080'}/api/:path*`
      },
      {
        source: '/trpc/:path*',
        destination: `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:8080'}/trpc/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
