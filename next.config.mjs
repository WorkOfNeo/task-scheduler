/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    optimizeCss: true,
    serverMinification: true,
    optimisticClientCache: true,
  },
};

export default nextConfig;
