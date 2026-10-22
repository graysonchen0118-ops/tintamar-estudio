import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // photos are resized and converted to AVIF or WebP by the photo CDN itself, at the width each screen asks for
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

export default nextConfig;
