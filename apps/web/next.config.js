/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@changelogkit/db"],
  async rewrites() {
    return [
      {
        source: "/embed/:slug.js",
        destination: "/api/embed/:slug",
      },
    ];
  },
};

module.exports = nextConfig;
