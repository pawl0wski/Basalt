import { create } from "storybook/theming";

export const createBasaltTheme = (raw: string) => {
    const token = (name: string): string => {
        const match = raw.match(new RegExp(`--raw-${name}:\\s*([^;]+);`));
        if (!match) throw new Error(`Missing raw token ${name}`);
        return match[1].trim();
    };

    return create({
        base: "dark",
        brandTitle: "Basalt",
        brandUrl: "/",
        appBg: token("gray-950"),
        appContentBg: token("gray-900"),
        appPreviewBg: token("gray-900"),
        appBorderColor: token("gray-800"),
        appBorderRadius: 4,
        textColor: token("gray-300"),
        textInverseColor: token("gray-950"),
        textMutedColor: token("gray-400"),
        barBg: token("gray-950"),
        barTextColor: token("gray-400"),
        barHoverColor: token("gray-200"),
        barSelectedColor: token("blue-300"),
        inputBg: token("gray-900"),
        inputBorder: token("gray-500"),
        inputTextColor: token("gray-300"),
        inputBorderRadius: 4,
        buttonBg: token("gray-850"),
        buttonBorder: token("gray-800"),
        booleanBg: token("gray-850"),
        booleanSelectedBg: token("gray-750"),
        colorPrimary: token("blue-600"),
        colorSecondary: token("blue-600"),
        fontBase: token("font-sans-stack"),
        fontCode: token("font-mono-stack"),
    });
};
