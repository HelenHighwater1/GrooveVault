import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Cover-photo scans upload a JPEG through identifyCoverAction.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mygroovevault.com" }],
        destination: "https://mygroovevault.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.discogs.com" },
      { protocol: "https", hostname: "api-img.discogs.com" },
      { protocol: "https", hostname: "st.discogs.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "na-9qh",
  project: "javascript-nextjs",

  // Source map upload auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack trace resolution
  widenClientFileUpload: true,

  // Proxy Sentry events through the app to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI output
  silent: !process.env.CI,
});
