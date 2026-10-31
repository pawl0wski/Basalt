import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import remarkGfm from "remark-gfm";

const config: StorybookConfig = {
    stories: [
        "../docs/**/*.mdx",
        "../docs/**/*.stories.@(ts|tsx)",
        "../src/**/*.mdx",
        "../src/**/*.stories.@(ts|tsx)",
    ],
    addons: [
        {
            name: "@storybook/addon-docs",
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: { remarkPlugins: [remarkGfm] },
                },
            },
        },
        "@storybook/addon-a11y",
        "@storybook/addon-vitest",
    ],
    framework: "@storybook/react-vite",
    env: (env) => ({
        ...env,
        STORYBOOK_RAW_TOKENS: readFileSync(
            new URL("../src/tokens/raw.css", import.meta.url),
            "utf8",
        ),
    }),
    core: {
        disableTelemetry: true,
        enableCrashReports: false,
        disableWhatsNewNotifications: true,
    },
    features: {
        sidebarOnboardingChecklist: false,
        menuOnboardingChecklist: false,
    },
    viteFinal: (viteConfig) => ({
        ...viteConfig,
        plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
    }),
};

export default config;
