/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["maplibre-gl", "@deck.gl/core", "@deck.gl/layers", "@deck.gl/mapbox"],
  poweredByHeader: false,
  images: {
    // Default device list goes up to 3840w, which was what the header logo
    // got selected against. Nothing on the site is a 4K source.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  async redirects() {
    return [
      { source: "/premium-dashboard", destination: "/dashboard", permanent: true },
      { source: "/subscription-terms", destination: "/terms-of-use", permanent: true },
      { source: "/login", destination: "/", permanent: true },
      { source: "/release-calendar", destination: "/calendar", permanent: false },
      { source: "/desk-agent", destination: "/desk-bot", permanent: true },
    ];
  },
};

export default nextConfig;
