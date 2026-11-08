import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "**/storybook-static/**",
            "src-tauri/gen/**",
            "src-tauri/target/**",
            "coverage/**",
            "playwright-report/**",
            "test-results/**",
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    },
    {
        files: [
            "*.config.{js,ts}",
            "eslint.config.js",
            "setupTests.ts",
            "**/scripts/**/*.{js,mjs,ts}",
        ],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ["packages/core/src/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        "react",
                        "react/*",
                        "@tauri-apps/*",
                        "@basalt/app",
                        "@basalt/ui",
                        "@basalt/api",
                        "@basalt/editor",
                    ],
                },
            ],
        },
    },
    {
        files: ["packages/ui/src/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        "@basalt/app",
                        "@basalt/app/*",
                        "@basalt/core",
                        "@basalt/core/*",
                        "@basalt/api",
                        "@basalt/api/*",
                        "@basalt/editor",
                        "@basalt/editor/*",
                        "@tauri-apps/*",
                    ],
                },
            ],
        },
    },
    {
        files: ["packages/api/src/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        "react",
                        "react/*",
                        "@basalt/app",
                        "@basalt/app/*",
                        "@basalt/ui",
                        "@basalt/ui/*",
                        "@basalt/editor",
                        "@basalt/editor/*",
                        "@tauri-apps/*",
                    ],
                },
            ],
        },
    },
    {
        files: ["packages/editor/src/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        "react",
                        "react/*",
                        "@tauri-apps/*",
                        "@basalt/*",
                    ],
                },
            ],
        },
    },
);
