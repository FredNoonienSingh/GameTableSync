import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@gts/ui'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
    resolveAlias: {
      '@mantine/core': './node_modules/@mantine/core',
      '@mantine/hooks': './node_modules/@mantine/hooks',
      '@mantine/dates': './node_modules/@mantine/dates',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_INTERNAL_URL
          ? `${process.env.BACKEND_INTERNAL_URL}/api/:path*`
          : 'http://127.0.0.1:5005/api/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);