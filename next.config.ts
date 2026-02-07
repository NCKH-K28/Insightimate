import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty'],
};

export default nextConfig;
