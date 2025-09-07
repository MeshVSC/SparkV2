/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {

      config.watchOptions = {
        ignored: ['**/*'],
      };
    }
    return config;
  },
  eslint: {

    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
