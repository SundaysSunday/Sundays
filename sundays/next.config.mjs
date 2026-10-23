/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  basePath: "/Sundays",
    output: "export",  // <=== enables static exports
    reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
};

export default nextConfig;

module.exports = nextConfig;
