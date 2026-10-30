import { spacingLevels } from "./tokenData";

export function SpacingRelations() {
    return (
        <div className="bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-border-divider">
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Relation</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Token</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Class</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Used for</th>
                        <th scope="col" className="py-in-group font-ui-strong">Source</th>
                    </tr>
                </thead>
                <tbody>
                    {spacingLevels.map((level) => (
                        <tr key={level.token} className="border-b border-border-divider align-top">
                            <td className="py-in-group pr-between-groups font-ui-strong">{level.relation}</td>
                            <td className="py-in-group pr-between-groups">
                                <code className="font-code text-size-code">{level.token}</code>
                                <span className="block text-size-ui-small text-text-muted">{level.value}</span>
                            </td>
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{level.utility}</code></td>
                            <td className="py-in-group pr-between-groups">{level.example}</td>
                            <td className="py-in-group text-text-muted">{level.source}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3 className="mb-between-groups mt-section font-ui-strong">The relations in a real group</h3>
            <div className="flex max-w-prose flex-col gap-section">
                <div className="flex flex-col gap-between-groups rounded-container border border-border-divider bg-surface-card p-settings-card">
                    <div className="flex flex-col gap-in-group">
                        <span className="font-ui-strong">Show word count</span>
                        <span className="text-size-ui-small text-text-muted">
                            Turn this off to hide the counters in the status bar.
                        </span>
                    </div>
                    <div className="flex items-center gap-in-group text-size-ui-small text-text-muted">
                        <span>Title and description: space-in-group</span>
                    </div>
                </div>
                <p className="m-none text-size-ui-small text-text-muted">
                    The gap above this line is space-section. Inside the card, rows use settings-card-padding, and the title and description use space-in-group.
                </p>
            </div>
        </div>
    );
}
