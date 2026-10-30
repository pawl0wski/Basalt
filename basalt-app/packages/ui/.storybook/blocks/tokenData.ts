export type ColorToken = {
    name: string;
    swatch: string;
    utility: string;
    use: string;
    avoid: string;
    source: string;
};

export const colorGroups: { title: string; tokens: ColorToken[] }[] = [
    {
        title: "Surfaces",
        tokens: [
            { name: "surface-frame", swatch: "bg-surface-frame", utility: "bg-surface-frame", use: "Title bar, activity bar, side panels, inactive tabs, settings page background.", avoid: "Editor, settings cards.", source: "R02.2, conflict 1" },
            { name: "surface-editor", swatch: "bg-surface-editor", utility: "bg-surface-editor", use: "Editor, active tab, status bar.", avoid: "Frames.", source: "R02.2, R01.1" },
            { name: "surface-card", swatch: "bg-surface-card", utility: "bg-surface-card", use: "Cards that group settings rows.", avoid: "Menus, dialogs.", source: "R01.5, contrast fix for the switch" },
            { name: "surface-raised", swatch: "bg-surface-raised", utility: "bg-surface-raised", use: "Menus, dialogs, tooltips, popovers, secondary buttons.", avoid: "Permanent window sections, switches, checkboxes.", source: "R01.1, A01, tokens.md rule 15" },
        ],
    },
    {
        title: "State and borders",
        tokens: [
            { name: "state-hover", swatch: "bg-state-hover", utility: "bg-state-hover", use: "Row, icon or card background on hover over surface-frame or surface-editor.", avoid: "As the only state indicator.", source: "R01.12, M1" },
            { name: "state-selected", swatch: "bg-state-selected", utility: "bg-state-selected", use: "Active file in the tree, active settings item, hover inside surface-raised.", avoid: "Control backgrounds, large areas.", source: "R01.12" },
            { name: "border-divider", swatch: "bg-border-divider", utility: "border-border-divider", use: "Section boundaries, lines between settings rows, outline of surface-raised.", avoid: "Control outlines (too faint).", source: "R01.1" },
            { name: "border-control", swatch: "bg-border-control", utility: "border-border-control", use: "Outline of inputs and checkboxes, off track of a switch.", avoid: "Decorative lines, on state-selected.", source: "WCAG 1.4.11" },
        ],
    },
    {
        title: "Text",
        tokens: [
            { name: "text-note", swatch: "bg-text-note", utility: "text-text-note", use: "Note text and headings.", avoid: "Interface.", source: "R01.10, R01.1" },
            { name: "text-ui", swatch: "bg-text-ui", utility: "text-text-ui", use: "Tree, tabs, setting titles, secondary buttons, menus.", avoid: "Note text.", source: "R02.2" },
            { name: "text-muted", swatch: "bg-text-muted", utility: "text-text-muted", use: "Setting descriptions, status bar, group headings, empty states, inactive tabs.", avoid: "Text needed to complete a task, error messages, text inside editor-selection.", source: "R01.5, R01.13, R01.6, R01.14" },
            { name: "text-link", swatch: "bg-text-link", utility: "text-text-link", use: "Links in notes and in the interface.", avoid: "Button backgrounds, large areas.", source: "R01.2" },
            { name: "text-on-accent", swatch: "bg-text-on-accent", utility: "text-text-on-accent", use: "Text and icon on action-primary.", avoid: "Any other background.", source: "R02.7" },
        ],
    },
    {
        title: "Icons, action and focus",
        tokens: [
            { name: "icon-default", swatch: "bg-icon-default", utility: "text-icon-default", use: "Inactive icons in section headers, activity bar, title bar.", avoid: "Active icons.", source: "R02.4, R02.1" },
            { name: "icon-active", swatch: "bg-icon-active", utility: "text-icon-active", use: "Icon of the active tool or panel.", avoid: "Decoration.", source: "R02.1, R02.4" },
            { name: "action-primary", swatch: "bg-action-primary", utility: "bg-action-primary", use: "Primary button, enabled switch, checked checkbox, count badge, active file and tab indicators.", avoid: "Section backgrounds, headings, decorative icons, text.", source: "R01.2, R02.3, R02.7" },
            { name: "action-primary-hover", swatch: "bg-action-primary-hover", utility: "hover:bg-action-primary-hover", use: "Hover and pressed state of the primary button.", avoid: "Anything else.", source: "derived from action-primary" },
            { name: "focus-ring", swatch: "bg-focus-ring", utility: "focus-visible:focus-ring", use: "Keyboard focus on every control: 2 px, 2 px offset.", avoid: "Hover, selection.", source: "focus gap, accepted proposal; WCAG 2.4.7" },
        ],
    },
    {
        title: "Status",
        tokens: [
            { name: "status-danger", swatch: "bg-status-danger", utility: "text-status-danger", use: "Sync error in the status bar, validation errors, destructive menu items.", avoid: "Button backgrounds, decoration.", source: "status colors gap, AB3" },
            { name: "status-warning", swatch: "bg-status-warning", utility: "text-status-warning", use: "Warnings such as a sync conflict, low-contrast accent warning.", avoid: "Decoration, labels.", source: "status colors gap" },
        ],
    },
    {
        title: "Component colors",
        tokens: [
            { name: "code-block-bg", swatch: "bg-code-block-bg", utility: "bg-code-block-bg", use: "Code blocks and inline code, with a border-divider outline.", avoid: "Other note content.", source: "R02.5" },
            { name: "button-secondary-bg", swatch: "bg-button-secondary-bg", utility: "bg-button-secondary-bg", use: "Secondary buttons, with a border-divider outline. Hover uses state-selected.", avoid: "The main action.", source: "R01.5" },
            { name: "editor-selection", swatch: "bg-editor-selection", utility: "bg-editor-selection", use: "Selected text in a note. Everything inside is text-note.", avoid: "Selected tree rows.", source: "R01.2" },
        ],
    },
];

export const spacingLevels = [
    { relation: "Inside a group", token: "space-in-group", value: "4 px", utility: "gap-in-group", example: "Icons in a row, icon and label, setting title and description.", source: "R01.7, R01.5" },
    { relation: "Between groups", token: "space-between-groups", value: "12 px", utility: "gap-between-groups", example: "Icon row and list, status bar fields, control and row text.", source: "R01.7, R01.6" },
    { relation: "Inside a panel", token: "space-panel", value: "12 px", utility: "p-panel", example: "Padding of the side panels, settings navigation and status bar.", source: "R01.7, R02.1" },
    { relation: "Between sections", token: "space-section", value: "32 px", utility: "gap-section", example: "Sections of the settings page, top margin of a note.", source: "R01.5, R01.7" },
    { relation: "Inside a settings row", token: "settings-card-padding", value: "16 px", utility: "p-settings-card", example: "Padding of a row in a settings card.", source: "R01.5" },
    { relation: "Between note blocks", token: "note-block-gap", value: "16 px", utility: "gap-note-block", example: "Under a paragraph, list or code block in a note.", source: "R01.11" },
    { relation: "Above note headings", token: "note-heading-gap", value: "24 px", utility: "mt-note-heading", example: "Above H2 and H3 in a note.", source: "R01.10" },
];
