const roles = [
    { role: "Note body", sample: "Notes are plain Markdown files in a folder you choose.", classes: "font-text text-size-note text-text-note", recipe: "font-text text-size-note text-text-note", spec: "16 px, line height 1.6", source: "R01.10, R01.11" },
    { role: "Note heading 1", sample: "Rzeczy do przeczytania", classes: "font-text text-size-note-h1 font-bold text-text-note", recipe: "text-size-note-h1 font-bold text-text-note", spec: "26 px, 700, line height 1.25. The largest text in the product.", source: "R01.10, T5" },
    { role: "Note heading 2", sample: "Reading list", classes: "font-text text-size-note-h2 font-bold text-text-note", recipe: "text-size-note-h2 font-bold text-text-note", spec: "20 px, 700", source: "R01.10, accepted proposal" },
    { role: "Note heading 3", sample: "Documentation", classes: "font-text text-size-note-h3 font-bold text-text-note", recipe: "text-size-note-h3 font-bold text-text-note", spec: "18 px, 700. H4 and lower use the same.", source: "R01.10, accepted proposal" },
    { role: "Section heading (interface)", sample: "Account and sync", classes: "font-text text-size-ui font-ui-strong text-text-ui", recipe: "text-size-ui font-ui-strong text-text-ui", spec: "13 px, 600. There is no larger interface title: a page title is a section heading.", source: "R01.5, T5" },
    { role: "Group heading (interface)", sample: "Core plugins", classes: "font-text text-size-ui-small font-ui-strong text-text-muted", recipe: "text-size-ui-small font-ui-strong text-text-muted", spec: "12 px, 600, muted.", source: "R01.5" },
    { role: "Label and UI text", sample: "Open folder as workspace", classes: "font-text text-size-ui text-text-ui", recipe: "text-size-ui text-text-ui", spec: "13 px, line height 1.5. Tree, tabs, buttons, menus, field labels.", source: "R01.10, R02.2" },
    { role: "Metadata", sample: "43 words 308 characters", classes: "font-text text-size-ui-small text-text-muted", recipe: "text-size-ui-small text-text-muted", spec: "12 px, muted. Descriptions, status bar, hints.", source: "R01.5, R01.6, R01.13" },
    { role: "Numbers", sample: "1 240 words", classes: "font-text text-size-ui-small text-text-muted tabular-nums", recipe: "tabular-nums on the role they appear in", spec: "Aligned digits in counters and tables. PROPOSAL: not in tokens.md.", source: "proposal" },
    { role: "Code", sample: "attachments/diagram.png", classes: "font-code text-size-code text-text-note", recipe: "font-code text-size-code", spec: "14 px, monospace, only in code and technical values such as paths.", source: "R02.5" },
];

export function TypeRoles() {
    return (
        <div className="flex flex-col bg-surface-editor p-panel">
            {roles.map((item) => (
                <div
                    key={item.role}
                    className="flex flex-col gap-between-groups border-t border-border-divider py-between-groups tablet:flex-row"
                >
                    <div className="flex flex-col gap-in-group font-text text-size-ui text-text-ui tablet:basis-1/3 tablet:shrink-0">
                        <span className="font-ui-strong">{item.role}</span>
                        <code className="font-code text-size-code text-text-muted">{item.recipe}</code>
                        <span className="text-size-ui-small text-text-muted">
                            {item.spec} Source: {item.source}.
                        </span>
                    </div>
                    <p className={`m-none max-w-prose ${item.classes}`}>{item.sample}</p>
                </div>
            ))}
        </div>
    );
}
