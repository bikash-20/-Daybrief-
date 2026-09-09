import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "daybrief-api",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 30 },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "daybrief-img",
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
