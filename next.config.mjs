/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  env: {
    VITE_API_URL: process.env.VITE_API_URL || 'https://smartserve-ai-restaurant-management.onrender.com/api',
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'SmartServe-AI-AWS',
    VITE_AWS_REGION: process.env.VITE_AWS_REGION || 'us-east-1',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://smartserve-ai-restaurant-management.onrender.com/api/:path*',
      },
    ];
  },
}

export default nextConfig

