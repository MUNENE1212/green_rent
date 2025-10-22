/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      's3.amazonaws.com',
      'greenrent-media.s3.amazonaws.com',
      'res.cloudinary.com'
    ],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    INTASEND_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY,
    GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
};

module.exports = nextConfig;
