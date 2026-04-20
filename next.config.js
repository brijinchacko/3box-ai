/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy auth URLs
      { source: '/signin', destination: '/login', permanent: true },
      { source: '/sign-in', destination: '/login', permanent: true },
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/sign-up', destination: '/signup', permanent: true },
      { source: '/log-in', destination: '/login', permanent: true },
      { source: '/login-in', destination: '/login', permanent: true },

      // Legacy tool / resume URLs
      { source: '/resume', destination: '/tools/resume-builder', permanent: true },
      { source: '/tools/resume', destination: '/tools/resume-builder', permanent: true },
      { source: '/ai-tools', destination: '/tools', permanent: true },
      { source: '/ai-resume', destination: '/tools/resume-builder', permanent: true },
      { source: '/resume-builder', destination: '/tools/resume-builder', permanent: true },
      { source: '/ats-check', destination: '/tools/ats-checker', permanent: true },
      { source: '/ats-scan', destination: '/tools/ats-checker', permanent: true },

      // Legacy brand / rebrand
      { source: '/jobted', destination: '/', permanent: true },
      { source: '/jobted/:path*', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/app', destination: '/dashboard', permanent: true },
      { source: '/features', destination: '/agents', permanent: true },
      { source: '/product', destination: '/agents', permanent: true },

      // Legacy blog paths
      { source: '/posts/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/articles/:slug', destination: '/blog/:slug', permanent: true },
    ];
  },
};

module.exports = nextConfig;
