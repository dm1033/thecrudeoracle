/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/distillate", destination: "/diesel", permanent: false }];
  },
};

export default nextConfig;
