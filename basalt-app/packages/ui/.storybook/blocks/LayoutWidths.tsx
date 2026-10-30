const widths = [
    { name: "320 px", utility: "Minimum window width", note: "The base layout. The note column shrinks to the window width minus 2 × note-column-padding-x (256 px of text).", source: "html min-width, note-column-padding-x" },
    { name: "768 px", utility: "tablet:", note: "Breakpoint token (PROPOSAL, widths are from the design system brief). Behavior of the three sections below this width is not decided.", source: "proposal" },
    { name: "1440 px", utility: "desktop:", note: "Breakpoint token (PROPOSAL). The desktop reference width: activity bar, side panel, note and right panel fit side by side.", source: "proposal, R01.7" },
];

const parts = [
    { token: "titlebar-height", utility: "h-titlebar", value: "36 px", source: "R01.3, R02.8" },
    { token: "activity-bar-width", utility: "w-activity-bar", value: "48 px", source: "R02.1" },
    { token: "sidebar-width", utility: "w-sidebar", value: "300 px", source: "R02.1, R01.7" },
    { token: "status-bar-height", utility: "h-status-bar", value: "24 px", source: "R01.6" },
    { token: "tree-row-height", utility: "h-tree-row", value: "28 px", source: "R01.11" },
    { token: "note-column-max-width", utility: "max-w-note", value: "700 px", source: "R01.8" },
    { token: "icon-button-size", utility: "size-icon-button", value: "28 px (click target at least 24 px)", source: "R01.7, WCAG 2.5.8" },
];

export function LayoutWidths() {
    return (
        <div className="flex flex-col gap-section bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <div className="flex flex-col gap-between-groups">
                <h3 className="m-none font-ui-strong">Window shell</h3>
                <div className="flex flex-col border border-border-divider">
                    <div className="flex h-titlebar items-center border-b border-border-divider bg-surface-frame px-between-groups text-text-muted">title bar</div>
                    <div className="flex">
                        <div className="flex w-activity-bar shrink-0 justify-center border-r border-border-divider bg-surface-frame py-panel text-size-ui-small text-text-muted">bar</div>
                        <div className="w-sidebar shrink-0 border-r border-border-divider bg-surface-frame p-panel text-text-muted">left section</div>
                        <div className="flex flex-1 justify-center bg-surface-editor p-panel text-text-muted">
                            <div className="w-full max-w-note border border-border-divider p-panel">note column</div>
                        </div>
                    </div>
                    <div className="flex h-status-bar items-center border-t border-border-divider bg-surface-editor px-between-groups text-size-ui-small text-text-muted">status bar</div>
                </div>
            </div>
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-border-divider">
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Width</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Class</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Behavior</th>
                        <th scope="col" className="py-in-group font-ui-strong">Source</th>
                    </tr>
                </thead>
                <tbody>
                    {widths.map((item) => (
                        <tr key={item.name} className="border-b border-border-divider align-top">
                            <td className="py-in-group pr-between-groups font-ui-strong">{item.name}</td>
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{item.utility}</code></td>
                            <td className="py-in-group pr-between-groups">{item.note}</td>
                            <td className="py-in-group text-text-muted">{item.source}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-border-divider">
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Layout token</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Class</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Value</th>
                        <th scope="col" className="py-in-group font-ui-strong">Source</th>
                    </tr>
                </thead>
                <tbody>
                    {parts.map((item) => (
                        <tr key={item.token} className="border-b border-border-divider">
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{item.token}</code></td>
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{item.utility}</code></td>
                            <td className="py-in-group pr-between-groups">{item.value}</td>
                            <td className="py-in-group text-text-muted">{item.source}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
