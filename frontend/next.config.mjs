/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: ['@smartbudget/shared'],
  env: {
    NEXT_PUBLIC_API_URL: 'https://smartbudget-api.vercel.app/api',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_PEXELS_KEY: process.env.NEXT_PUBLIC_PEXELS_KEY || '',
    NEXT_PUBLIC_PIXABAY_KEY: process.env.NEXT_PUBLIC_PIXABAY_KEY || '',
  },
};

export default nextConfig;
