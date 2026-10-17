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
            "src-tauri/gen/**",
            "src-tauri/target/**",
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
        files: ["*.config.{js,ts}", "eslint.config.js", "setupTests.ts"],
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
                        "@tauri-apps/*",
                    ],
                },
            ],
        },
    },
);
