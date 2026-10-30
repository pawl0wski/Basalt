import type { Decorator, Preview } from "@storybook/react-vite";
import raw from "../src/tokens/raw.css?raw";
import { createBasaltTheme } from "./theme";
import { themes } from "./themes";
import "./preview.css";

const accentOptions = [
    { value: "blue", title: "Blue (default)" },
    { value: "green", title: "Green (Obsidian)" },
    { value: "amber", title: "Amber" },
    { value: "purple", title: "Purple" },
];

const initialTheme = import.meta.env.STORYBOOK_THEME ?? themes[0];
const initialAccent = "blue";

const applyTheme = (theme: string) => {
    document.documentElement.dataset.theme = theme;
};

const applyAccent = (accentKey: string) => {
    document.documentElement.dataset.accent = accentKey;
};

applyTheme(initialTheme);
applyAccent(initialAccent);

const withTheme: Decorator = (Story, context) => {
    applyTheme(context.globals.theme ?? initialTheme);
    applyAccent(context.globals.accent ?? initialAccent);
    return <Story />;
};

const preview: Preview = {
    decorators: [withTheme],
    globalTypes: {
        theme: {
            description: "Theme, set on the document root so portals inherit it",
            toolbar: {
                title: "Theme",
                icon: "contrast",
                items: themes.map((theme) => ({ value: theme, title: theme })),
                dynamicTitle: true,
            },
        },
        accent: {
            description: "User-defined accent color (R01.2)",
            toolbar: {
                title: "Accent",
                icon: "paintbrush",
                items: accentOptions,
                dynamicTitle: true,
            },
        },
    },
    initialGlobals: { theme: initialTheme, accent: initialAccent },
    parameters: {
        a11y: { test: "error" },
        layout: "centered",
        backgrounds: { disabled: true },
        controls: { matchers: { date: /Date$/ } },
        docs: { theme: createBasaltTheme(raw) },
        viewport: {
            options: {
                mobile: {
                    name: "320 px",
                    styles: { width: "320px", height: "720px" },
                },
                tablet: {
                    name: "768 px",
                    styles: { width: "768px", height: "900px" },
                },
                desktop: {
                    name: "1440 px",
                    styles: { width: "1440px", height: "900px" },
                },
            },
        },
        options: {
            storySort: {
                order: [
                    "Design system",
                    ["Start here", "Components", "How to choose", "Usage and accessibility", "Content", "What to avoid", "What is missing", "Contributing", "Epics"],
                    "Foundations",
                    "Primitives",
                    "Product",
                    "Patterns",
                ],
            },
        },
    },
    tags: ["autodocs"],
};

export default preview;
