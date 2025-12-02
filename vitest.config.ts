import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "core/runner/src/**/*.ts",
        "core/db/src/**/*.ts",
        "scripts/lib/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "**/cli.ts", "**/index.ts"],
    },
    testTimeout: 30000, // 30s pour les tests de compilation C
  },
  resolve: {
    alias: {
      // Map .js imports to .ts source files for testing
      "../core/runner/src/utils.js": resolve(
        __dirname,
        "core/runner/src/utils.ts"
      ),
      "../core/runner/src/executor-ts.js": resolve(
        __dirname,
        "core/runner/src/executor-ts.ts"
      ),
      "../core/runner/src/executor-c.js": resolve(
        __dirname,
        "core/runner/src/executor-c.ts"
      ),
      "../core/runner/src/types.js": resolve(
        __dirname,
        "core/runner/src/types.ts"
      ),
      "../core/db/src/database.js": resolve(
        __dirname,
        "core/db/src/database.ts"
      ),
      // Scripts lib
      "../scripts/lib/scaffold.js": resolve(
        __dirname,
        "scripts/lib/scaffold.ts"
      ),
      "../scripts/lib/publish-day.js": resolve(
        __dirname,
        "scripts/lib/publish-day.ts"
      ),
      "../scripts/lib/sync-tools.js": resolve(
        __dirname,
        "scripts/lib/sync-tools.ts"
      ),
    },
  },
});
