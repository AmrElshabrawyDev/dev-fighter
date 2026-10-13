import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // "@/…" imports, as in the app
    // "server-only" throws outside Next's server build; in tests it's a no-op
    alias: { "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // the official-renderer tests start a real browser first
    testTimeout: 30_000,
  },
});
