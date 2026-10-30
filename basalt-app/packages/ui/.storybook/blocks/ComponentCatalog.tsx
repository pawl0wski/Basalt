import { TextLink } from "../../src/components/TextLink";
import { catalog } from "./catalog";

function link(id: string) {
    const path = `?path=/docs/${id}--docs`;
    try {
        return new URL(path, window.parent.location.href).toString();
    } catch {
        return path;
    }
}

export function ComponentTable() {
    return (
        <div className="overflow-x-auto bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr>
                        {["Name", "Import from @basalt/ui", "Use it for", "Do not use it for"].map((heading) => (
                            <th key={heading} scope="col" className="p-in-group font-ui-strong">{heading}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {catalog.map((entry) => (
                        <tr key={entry.name} className="border-t border-border-divider align-top">
                            <th scope="row" className="p-in-group font-normal">
                                <TextLink variant="standalone" href={link(entry.docs)} target="_top">{entry.name}</TextLink>
                            </th>
                            <td className="p-in-group font-code text-size-code">{entry.importName}</td>
                            <td className="p-in-group">{entry.use}</td>
                            <td className="p-in-group text-text-muted">{entry.avoid}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ComponentCatalog() {
    const groups = ["Primitives", "Product", "Patterns"] as const;
    return (
        <div className="flex flex-col gap-section bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            {groups.map((group) => (
                <section key={group} className="flex flex-col gap-between-groups">
                    <h2 className="font-ui-strong text-size-ui text-text-ui">{group}</h2>
                    <div className="flex flex-col divide-y divide-border-divider rounded-container border border-border-divider bg-surface-card">
                        {catalog.filter((entry) => entry.group === group).map((entry) => (
                            <div key={entry.name} className="flex flex-col gap-between-groups p-settings-card tablet:flex-row tablet:items-center">
                                <div className="flex w-full flex-col gap-in-group tablet:w-sidebar tablet:shrink-0">
                                    <TextLink variant="standalone" href={link(entry.docs)} target="_top">{entry.name}</TextLink>
                                    <p className="text-size-ui-small text-text-muted">{entry.summary}</p>
                                </div>
                                <div className="min-w-none flex-1">
                                    {entry.preview ?? <p className="text-size-ui-small text-text-muted">Opens on demand, see its page.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
