export type ContrastPair = {
    foreground: string;
    background: string;
    kind: "text" | "ui";
    verdict: "pass" | "fail" | "decorative";
    source: string;
    note?: string;
};

const textOn = (
    foreground: string,
    backgrounds: string[],
    source: string,
): ContrastPair[] =>
    backgrounds.map((background) => ({
        foreground,
        background,
        kind: "text",
        verdict: "pass",
        source,
    }));

export const contrastPairs: ContrastPair[] = [
    ...textOn(
        "text-note",
        ["surface-editor", "code-block-bg", "editor-selection", "state-selected"],
        "R01.10, R01.1, WCAG 1.4.3",
    ),
    ...textOn(
        "text-ui",
        [
            "surface-frame",
            "surface-editor",
            "surface-card",
            "surface-raised",
            "state-hover",
            "button-secondary-bg",
            "state-selected",
        ],
        "R02.2, WCAG 1.4.3",
    ),
    ...textOn(
        "text-muted",
        [
            "surface-frame",
            "surface-editor",
            "surface-card",
            "surface-raised",
            "state-selected",
        ],
        "R01.5, R01.13, WCAG 1.4.3",
    ),
    {
        foreground: "text-muted",
        background: "editor-selection",
        kind: "text",
        verdict: "fail",
        source: "tokens.md contrast table",
        note: "Never occurs: selected text uses text-note.",
    },
    ...textOn(
        "text-link",
        ["surface-frame", "surface-editor", "surface-raised", "state-selected"],
        "R01.2, WCAG 1.4.3",
    ),
    {
        foreground: "text-link",
        background: "editor-selection",
        kind: "text",
        verdict: "fail",
        source: "tokens.md rule 16",
        note: "A link inside a selection takes text-note.",
    },
    ...textOn(
        "text-on-accent",
        ["action-primary", "action-primary-hover"],
        "R02.7, WCAG 1.4.3",
    ),
    ...textOn(
        "status-danger",
        [
            "surface-frame",
            "surface-editor",
            "surface-card",
            "surface-raised",
            "state-hover",
            "state-selected",
        ],
        "AB3, WCAG 1.4.3",
    ),
    ...textOn(
        "status-warning",
        ["surface-frame", "surface-editor", "surface-raised"],
        "WCAG 1.4.3",
    ),
    ...["surface-frame", "surface-editor", "surface-card"].map(
        (background): ContrastPair => ({
            foreground: "action-primary",
            background,
            kind: "ui",
            verdict: "pass",
            source: "R02.1, WCAG 1.4.11",
        }),
    ),
    {
        foreground: "action-primary",
        background: "surface-raised",
        kind: "ui",
        verdict: "fail",
        source: "tokens.md rule 15",
        note: "Switches and checkboxes never stand on surface-raised. A labelled button is fine, the label identifies it.",
    },
    {
        foreground: "text-on-accent",
        background: "border-control",
        kind: "ui",
        verdict: "pass",
        source: "WCAG 1.4.11",
        note: "Switch thumb on the off track.",
    },
    ...["surface-frame", "surface-editor", "surface-raised"].map(
        (background): ContrastPair => ({
            foreground: "border-control",
            background,
            kind: "ui",
            verdict: "pass",
            source: "WCAG 1.4.11",
        }),
    ),
    {
        foreground: "border-control",
        background: "state-selected",
        kind: "ui",
        verdict: "fail",
        source: "tokens.md rule 15",
        note: "Controls never stand on a selected row.",
    },
    ...["surface-frame", "surface-editor", "surface-raised", "state-selected"].map(
        (background): ContrastPair => ({
            foreground: "focus-ring",
            background,
            kind: "ui",
            verdict: "pass",
            source: "WCAG 2.4.11, 1.4.11",
        }),
    ),
    {
        foreground: "focus-ring",
        background: "action-primary",
        kind: "ui",
        verdict: "fail",
        source: "tokens.md contrast table",
        note: "Fixed by the 2 px offset: the ring sits on the surface behind the control.",
    },
    ...["surface-frame", "surface-editor"].map(
        (background): ContrastPair => ({
            foreground: "icon-default",
            background,
            kind: "ui",
            verdict: "pass",
            source: "R02.4, WCAG 1.4.11",
        }),
    ),
    {
        foreground: "icon-active",
        background: "surface-frame",
        kind: "ui",
        verdict: "pass",
        source: "R02.1, WCAG 1.4.11",
    },
    {
        foreground: "state-selected",
        background: "surface-frame",
        kind: "ui",
        verdict: "fail",
        source: "tokens.md contrast table",
        note: "Shade alone is not a state indicator. Add the 2 px indicator (tree-selected-indicator).",
    },
    {
        foreground: "surface-editor",
        background: "surface-frame",
        kind: "ui",
        verdict: "fail",
        source: "tokens.md contrast table",
        note: "Shade alone does not mark the active tab. Add tab-active-indicator.",
    },
    {
        foreground: "border-divider",
        background: "surface-editor",
        kind: "ui",
        verdict: "decorative",
        source: "R01.1",
        note: "A divider is decoration. A 3:1 line would be loud, against R01.1.",
    },
];

export const thresholds = { text: 4.5, ui: 3 } as const;
