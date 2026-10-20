import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests resolve `@/…` the same way the app does (tsconfig.json "paths").
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
