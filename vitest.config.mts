import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal Vitest setup for The Crude Oracle.
//
// Two test "worlds" share this one config:
//  - Data-integrity / route-smoke tests run fine in plain Node.
//  - FreshnessBadge is a "use client" component that needs a DOM
//    (useState/useEffect), so the whole suite runs under jsdom — it's
//    cheap enough for a project this size and keeps one config instead of
//    per-file environment overrides.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    globals: false,
    css: false,
  },
});
