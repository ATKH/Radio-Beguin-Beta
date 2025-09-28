/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'feeds.soundcloud.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.sndcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'i2.sndcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'placeholder-image-service.onrender.com',
      },
    ],
  },
};

module.exports = nextConfig;
