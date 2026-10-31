import { addons } from "storybook/manager-api";
import { createBasaltTheme } from "./theme";

addons.setConfig({
    theme: createBasaltTheme(process.env.STORYBOOK_RAW_TOKENS ?? ""),
    sidebar: { showRoots: true },
});
