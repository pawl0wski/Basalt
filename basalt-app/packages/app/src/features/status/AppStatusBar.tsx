import { SaveStatus, StatusBar, type SaveState } from "@basalt/ui";

export type AppStatusBarProps = {
    saveState: SaveState | null;
    labels: Record<SaveState, string>;
};

export function AppStatusBar({ saveState, labels }: AppStatusBarProps) {
    return (
        <StatusBar
            trailing={
                saveState ? (
                    <SaveStatus state={saveState} messages={labels} />
                ) : null
            }
        />
    );
}
