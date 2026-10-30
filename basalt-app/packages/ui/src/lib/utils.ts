import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const colors = [
    "surface-frame",
    "surface-editor",
    "surface-card",
    "surface-raised",
    "state-hover",
    "state-selected",
    "border-divider",
    "border-control",
    "text-note",
    "text-ui",
    "text-muted",
    "text-link",
    "text-on-accent",
    "icon-default",
    "icon-active",
    "action-primary",
    "action-primary-hover",
    "focus-ring",
    "status-danger",
    "status-warning",
    "code-block-bg",
    "button-secondary-bg",
    "editor-selection",
];

const fontSizes = [
    "size-note",
    "size-note-h1",
    "size-note-h2",
    "size-note-h3",
    "size-code",
    "size-ui",
    "size-ui-small",
];

const spacing = [
    "in-group",
    "between-groups",
    "panel",
    "section",
    "note-x",
    "note-block",
    "note-heading",
    "settings-card",
    "titlebar",
    "activity-bar",
    "sidebar",
    "status-bar",
    "tree-row",
    "icon",
    "activity-icon",
    "activity-button",
    "icon-button",
    "tab-indicator",
    "tree-indicator",
    "none",
];

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            color: colors,
            text: fontSizes,
            spacing,
            radius: ["control", "container", "switch"],
            "font-weight": ["ui-strong"],
            container: ["note", "prose"],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
