import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [{
        source: '/grid',
        has: [{ type: 'query', key: 'motion', value: 'classic' }],
        destination: '/grid/classic',
      }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
