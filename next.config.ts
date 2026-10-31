import type { NextConfig } from "next";

import { features } from "./src/lib/features";

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
  // Security headers on every page (security review, 2026-10-28): no other site may show Nia
  // inside a frame (stops clickjacking on sign-in, Share and Delete), browsers mustn't guess
  // file types, other sites see only our address (not the page or its share token) when someone
  // follows a link out, and camera, microphone and location stay off (nothing uses them).
  // HTTPS-only (HSTS) is already sent by Vercel.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  // Home moved from /dashboard; keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: true },
      // "Preview Explore" before early access opened Explore itself (Ika, 2026-10-21).
      { source: "/explore/preview", destination: "/explore", permanent: false },
      // By category now lives on Explore itself (Ika, 2026-10-29).
      { source: "/explore/categories", destination: "/explore#by-category", permanent: false },
      // Marketplace is hidden for now (Ika, 2026-10-23).
      ...(features.marketplaceShown ? [] : [{ source: "/marketplace/:path*", destination: "/home", permanent: false }]),
      // Explore's Feed is hidden for now (Ika, 2026-10-31).
      ...(features.exploreFeedShown ? [] : [{ source: "/explore/feed", destination: "/explore", permanent: false }]),
      // Explore all's quick view is hidden (Ika, 2026-10-31).
      ...(features.exploreQuickViewShown ? [] : [{ source: "/explore/all/quick", destination: "/explore/all", permanent: false }]),
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
