import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["./setupTests.ts"],
        include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    },
});
