import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // 90 for the full-bleed auth/onboarding hero images; 75 is the default elsewhere.
    qualities: [75, 90],
    // Project covers and profile photos in Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  partialPrefetching: true,
  // Home moved from /dashboard; keep old links and bookmarks working.
  async redirects() {
    return [{ source: "/dashboard", destination: "/home", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
