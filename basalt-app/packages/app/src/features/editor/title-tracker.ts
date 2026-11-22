import { firstHeading } from "@basalt/core";

export type TitleSelection = { readonly from: number; readonly to: number };

export type TitleTracker = {
    update(text: string, selection: TitleSelection): void;
    blur(): void;
};

export function isOnHeading(text: string, selection: TitleSelection): boolean {
    const heading = firstHeading(text);
    if (!heading) return false;
    return (
        selection.from <= heading.line.to && selection.to >= heading.line.from
    );
}

export function createTitleTracker(commit: () => void): TitleTracker {
    let wasOnHeading = false;
    return {
        update(text, selection) {
            const onHeading = isOnHeading(text, selection);
            if (wasOnHeading && !onHeading) commit();
            wasOnHeading = onHeading;
        },
        blur() {
            if (wasOnHeading) commit();
        },
    };
}
