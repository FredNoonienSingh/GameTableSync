import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  transpilePackages: ['@gts/ui'],
  allowedDevOrigins: ['192.168.178.47'],
  // Tell Turbopack where the monorepo root (and node_modules) actually lives
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/billing/:path*',
        destination: process.env.BACKEND_INTERNAL_URL
          ? `${process.env.BACKEND_INTERNAL_URL}/api/billing/:path*`
          : 'http://127.0.0.1:5001/api/billing/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);