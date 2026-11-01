import { Skeleton, WelcomeScreen } from "@basalt/ui";
import { useStore } from "../model/store";

export function Welcome() {
    const { state, dispatch } = useStore();
    if (state.restoring)
        return (
            <div
                data-gap="DSG-09"
                role="status"
                aria-busy="true"
                className="flex h-full flex-col items-start justify-center gap-between-groups bg-surface-editor p-section"
            >
                <p className="text-size-note text-text-ui">
                    Restoring your last workspace and note…
                </p>
                <div className="flex w-full max-w-prose flex-col gap-in-group">
                    <Skeleton className="h-tree-row" />
                    <Skeleton className="h-tree-row" />
                    <Skeleton className="h-tree-row" />
                </div>
            </div>
        );
    return (
        <div className="flex h-full flex-col overflow-y-auto bg-surface-editor">
            <div className="flex-1">
                <WelcomeScreen
                    onOpenWorkspace={() => dispatch({ type: "pick-workspace" })}
                    notice={state.notice}
                />
            </div>
            <div className="flex flex-col gap-in-group border-t border-border-divider p-panel text-size-ui-small text-text-muted">
                <p role="status">{state.status}</p>
                <p>
                    Prototype: the operating system folder picker is simulated.
                    The folder it returns is set in the review bar, under
                    &quot;Folder picker result&quot;.
                </p>
            </div>
        </div>
    );
}
