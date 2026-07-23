/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve images directly instead of through Vercel's optimizer. External
    // sources (Wikimedia) and uploaded data-URI images then load reliably in
    // production. Revisit once product photos live on fast storage (R2).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // product/category images served from R2/S3
    ],
  },
};

module.exports = nextConfig;
