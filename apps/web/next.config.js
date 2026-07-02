/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // product/category images served from R2/S3
    ],
  },
};

module.exports = nextConfig;
