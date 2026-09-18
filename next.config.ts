import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.discogs.com" },
      { protocol: "https", hostname: "api-img.discogs.com" },
      { protocol: "https", hostname: "st.discogs.com" },
    ],
  },
};

export default nextConfig;
