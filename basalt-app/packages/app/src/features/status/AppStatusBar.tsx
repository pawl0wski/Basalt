import { StatusBar } from "@basalt/ui";

export type AppStatusBarProps = {
    wordCount: number | null;
    formatWordCount: (count: number) => string;
};

export function AppStatusBar({
    wordCount,
    formatWordCount,
}: AppStatusBarProps) {
    return (
        <StatusBar
            trailing={
                wordCount === null ? null : (
                    <span>{formatWordCount(wordCount)}</span>
                )
            }
        />
    );
}
