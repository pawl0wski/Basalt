import { FilePlus, FolderPlus, Search, Settings } from "lucide-react";

const sizes = [
    { token: "icon-size", classes: "size-icon", value: "16 px", use: "Section headers, title bar, tree, status bar.", source: "R02.4" },
    { token: "activity-icon-size", classes: "size-activity-icon", value: "20 px", use: "Activity bar, inside a 36 px button (size-activity-button).", source: "tokens.md icon-size" },
];

export function IconSizes() {
    return (
        <div className="flex flex-col gap-between-groups bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            {sizes.map((item) => (
                <div key={item.token} className="flex items-center gap-between-groups border-t border-border-divider py-between-groups">
                    <span className="flex items-center gap-between-groups text-icon-default">
                        <FilePlus aria-hidden="true" className={item.classes} />
                        <FolderPlus aria-hidden="true" className={item.classes} />
                        <Search aria-hidden="true" className={item.classes} />
                        <Settings aria-hidden="true" className={`${item.classes} text-icon-active`} />
                    </span>
                    <span className="flex flex-col gap-in-group">
                        <code className="font-code text-size-code">{item.token} · {item.value} · {item.classes}</code>
                        <span>{item.use}</span>
                        <span className="text-size-ui-small text-text-muted">Source: {item.source}. The last icon shows icon-active.</span>
                    </span>
                </div>
            ))}
        </div>
    );
}
