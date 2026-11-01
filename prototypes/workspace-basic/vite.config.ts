import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = (path: string) =>
    fileURLToPath(new URL(`../../${path}`, import.meta.url));

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [
            {
                find: "@basalt/ui/styles.css",
                replacement: root("basalt-app/packages/ui/src/styles.css"),
            },
            {
                find: "@basalt/ui",
                replacement: root("basalt-app/packages/ui/src/index.ts"),
            },
        ],
    },
    server: {
        port: 5174,
        fs: { allow: [root("")] },
    },
});
