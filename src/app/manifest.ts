import type { MetadataRoute } from "next";
import { WINDOW_COLOR } from "@/lib/theme";

// Nia as an app on the computer (Ika, 2026-11-20, desktop step 1): Chrome and Edge offer
// Install, Safari offers Add to Dock, and Nia opens in its own window from the Dock or Start
// menu. "/" sends people to Home, or to Log in when they're signed out.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nia OS",
    short_name: "Nia",
    description: "The operating system for creative production.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // The window before the page draws; the page then sets its own bar colour (light or dark).
    background_color: WINDOW_COLOR.light,
    theme_color: WINDOW_COLOR.light,
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full square with the mark in the middle, for launchers that cut icons into their own shape.
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
