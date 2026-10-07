import { defineConfig } from "vitest/config";
import path from "node:path";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/okoume_test";

// Safety net: the tests wipe their database. Refuse anything that is not a dedicated *_test database.
if (!/_test$/.test(new URL(TEST_DB).pathname)) {
  throw new Error("TEST_DATABASE_URL must point to a database whose name ends with _test");
}

// Integration tests run the real DAL against a real Postgres (okoume_test). Only the session lookup is faked.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/empty.ts"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    setupFiles: ["test/setup.ts"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DB,
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
      BETTER_AUTH_URL: "http://localhost:3000",
      DEMO_MODE: "1",
      RESEND_API_KEY: "",
    },
  },
});
