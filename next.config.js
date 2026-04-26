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

      // Common shortcut URLs people / external sites might link
      // (these were 404'ing — likely the source of GSC "Not Found" errors)
      { source: '/jobs', destination: '/in', permanent: true }, // jobs landing → India hub (our jobs market)
      { source: '/cover-letter', destination: '/tools/cover-letter-generator', permanent: true },
      { source: '/cover-letter-generator', destination: '/tools/cover-letter-generator', permanent: true },
      { source: '/cover-letter-builder', destination: '/tools/cover-letter-generator', permanent: true },
      { source: '/salary', destination: '/tools/salary-estimator', permanent: true },
      { source: '/salary-estimator', destination: '/tools/salary-estimator', permanent: true },
      { source: '/salary-calculator', destination: '/tools/salary-estimator', permanent: true },
      { source: '/linkedin-headline', destination: '/tools/linkedin-headline-generator', permanent: true },
      { source: '/linkedin-headline-generator', destination: '/tools/linkedin-headline-generator', permanent: true },
      { source: '/linkedin-summary', destination: '/tools/linkedin-headline-generator', permanent: true },
      { source: '/cold-email', destination: '/tools/cold-email-generator', permanent: true },
      { source: '/cold-email-generator', destination: '/tools/cold-email-generator', permanent: true },
      { source: '/skills-gap', destination: '/tools/skills-gap-finder', permanent: true },
      { source: '/skills-gap-finder', destination: '/tools/skills-gap-finder', permanent: true },
      { source: '/skill-gap', destination: '/tools/skills-gap-finder', permanent: true },
      { source: '/agent', destination: '/agents', permanent: true },
      { source: '/assessment', destination: '/get-started', permanent: true },
      { source: '/skill-assessment', destination: '/get-started', permanent: true },
      { source: '/interview', destination: '/tools/interview-question-prep', permanent: true },
      { source: '/interview-prep', destination: '/tools/interview-question-prep', permanent: true },
      { source: '/mock-interview', destination: '/tools/interview-question-prep', permanent: true },
      { source: '/demo', destination: '/signup', permanent: true },
      { source: '/trial', destination: '/signup', permanent: true },
      { source: '/start', destination: '/get-started', permanent: true },
      { source: '/free', destination: '/pricing', permanent: true },
      { source: '/chatgpt-resume', destination: '/blog/chatgpt-resume-prompts-templates-2026', permanent: true },
      { source: '/chatgpt-resume-prompts', destination: '/blog/chatgpt-resume-prompts-templates-2026', permanent: true },
      { source: '/ai-resume-builder', destination: '/tools/resume-builder', permanent: true },
      { source: '/chrome-extension', destination: '/agents', permanent: true },
      { source: '/extension', destination: '/agents', permanent: true },

      // India market shortcuts
      { source: '/india', destination: '/in', permanent: true },
      { source: '/jobs-india', destination: '/in', permanent: true },
      { source: '/jobs-in-india', destination: '/in', permanent: true },
      { source: '/pricing-india', destination: '/pricing', permanent: true },
      { source: '/jobs-bangalore', destination: '/in/bangalore', permanent: true },
      { source: '/jobs-mumbai', destination: '/in/mumbai', permanent: true },
      { source: '/jobs-delhi', destination: '/in/delhi', permanent: true },
      { source: '/jobs-hyderabad', destination: '/in/hyderabad', permanent: true },
      { source: '/jobs-pune', destination: '/in/pune', permanent: true },
    ];
  },
};

module.exports = nextConfig;
