/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['frappe-gantt'],
  eslint: {
    // Disable ESLint during builds for now
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
