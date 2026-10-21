import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // 90 for the full-bleed auth/onboarding hero images; 75 is the default elsewhere.
    qualities: [75, 90],
    // Project covers and profile photos in Supabase Storage.
    // YouTube's own trailer thumbnails (Explore), fetched by our server so the browser doesn't
    // contact YouTube until Play is pressed.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
  partialPrefetching: true,
  // Home moved from /dashboard; keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: true },
      // "Preview Explore" before early access opened Explore itself (Ika, 2026-10-21).
      { source: "/explore/preview", destination: "/explore", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        // CSS modules (the uiarc components) don't use Tailwind, and renaming them to
        // plain .css would drop their scoped class names.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
