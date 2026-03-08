/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'archive.org' },
    ],
  },
};

module.exports = nextConfig;
