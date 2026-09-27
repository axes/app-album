import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig uses `jsx: "preserve"` (Next.js compiles JSX itself), so Vitest's
  // esbuild transform must be told to use the automatic runtime when it loads
  // .tsx Server Components directly.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real `server-only` marker throws outside a React Server Component.
      // Tests that exercise server modules (e.g. getCurrentUser) must resolve it
      // to the no-op stub so the production boundary can be imported directly.
      "server-only": fileURLToPath(
        new URL("./src/test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
});
