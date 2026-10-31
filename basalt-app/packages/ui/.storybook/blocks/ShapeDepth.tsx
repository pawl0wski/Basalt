const radii = [
    {
        token: "radius-control",
        value: "4 px",
        classes: "rounded-control",
        use: "Buttons, inputs, tree rows, tabs (top corners), menu items, code.",
        avoid: "Cards and dialogs.",
        source: "R01.12",
    },
    {
        token: "radius-container",
        value: "8 px",
        classes: "rounded-container",
        use: "Settings cards, menus, dialogs.",
        avoid: "Controls. Nothing larger (A01).",
        source: "R01.5, A01",
    },
];

export function ShapeDepth() {
    return (
        <div className="flex flex-col gap-section bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <div className="flex flex-col gap-between-groups tablet:flex-row">
                {radii.map((item) => (
                    <div
                        key={item.token}
                        className="flex flex-1 flex-col gap-between-groups"
                    >
                        <div
                            className={`${item.classes} flex items-center py-section justify-center border border-border-divider bg-surface-card text-text-muted`}
                        >
                            {item.token}
                        </div>
                        <div className="flex flex-col gap-in-group">
                            <code className="font-code text-size-code">
                                {item.token} · {item.value} · {item.classes}
                            </code>
                            <span>Use: {item.use}</span>
                            <span>Avoid: {item.avoid}</span>
                            <span className="text-size-ui-small text-text-muted">
                                Source: {item.source}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-between-groups">
                <h3 className="m-none font-ui-strong">
                    Layers: shade and a 1 px line, no shadow
                </h3>
                <div className="flex flex-col gap-between-groups tablet:flex-row">
                    <div className="flex h-icon-button items-center border border-border-divider bg-surface-frame px-between-groups text-size-ui-small text-text-muted tablet:flex-1">
                        surface-frame
                    </div>
                    <div className="flex h-icon-button items-center border border-border-divider bg-surface-editor px-between-groups text-size-ui-small text-text-muted tablet:flex-1">
                        surface-editor
                    </div>
                    <div className="flex h-icon-button items-center rounded-container border border-border-divider bg-surface-raised px-between-groups text-size-ui-small text-text-muted tablet:flex-1">
                        surface-raised + border-divider
                    </div>
                </div>
                <ul className="m-none flex max-w-prose flex-col gap-in-group pl-section">
                    <li>
                        There is no shadow token, so shadow utilities do not
                        exist. A layer above content is separated by shade plus
                        a border-divider outline (R01.1, A01).
                    </li>
                    <li>
                        Window sections are separated by a 1 px border-divider
                        line and a gap of 0 (R01.1, R02.2).
                    </li>
                    <li>
                        Borders are 1 px. Control outlines use border-control,
                        dividers use border-divider (WCAG 1.4.11).
                    </li>
                    <li>
                        Hover and selection change only the background shade.
                        The 2 px indicator on the active tab is the exception
                        (R01.12, contrast fix). A selected list row is a rounded
                        fill, tinted while the list has focus (owner decision
                        2026-10-30).
                    </li>
                </ul>
            </div>
        </div>
    );
}
