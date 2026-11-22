import { isolateHistory } from "@codemirror/commands";
import {
    EditorSelection,
    type ChangeSpec,
    type SelectionRange,
} from "@codemirror/state";
import type { Command, KeyBinding } from "@codemirror/view";
import type { TextRange } from "./livePreview";

export type EmphasisMarker = "**" | "*";

export type EmphasisEdit = {
    readonly changes: readonly {
        readonly from: number;
        readonly to: number;
        readonly insert: string;
    }[];
    readonly range: TextRange;
};

function runBefore(text: string, position: number): number {
    let start = position;
    while (start > 0 && text[start - 1] === "*") start--;
    const run = position - start;
    if (run > 0 && start > 0 && text[start - 1] === "\\") return run - 1;
    return run;
}

function runAfter(text: string, position: number): number {
    if (position > 0 && text[position - 1] === "\\") return 0;
    let end = position;
    while (end < text.length && text[end] === "*") end++;
    return end - position;
}

function isActive(run: number, marker: EmphasisMarker): boolean {
    return marker === "**" ? run >= 2 : run % 2 === 1;
}

export function computeEmphasisToggle(
    text: string,
    range: TextRange,
    marker: EmphasisMarker,
): EmphasisEdit | null {
    const from = Math.max(0, Math.min(range.from, range.to, text.length));
    const to = Math.min(text.length, Math.max(range.from, range.to));
    const length = marker.length;
    const selected = text.slice(from, to);
    if (to > from && selected.trim() === "") return null;

    const open = runBefore(text, from);
    const close = runAfter(text, to);
    if (open === close && isActive(open, marker)) {
        return {
            changes: [
                { from: from - length, to: from, insert: "" },
                { from: to, to: to + length, insert: "" },
            ],
            range: { from: from - length, to: to - length },
        };
    }

    const lead = /^\*+/.exec(selected)?.[0].length ?? 0;
    const trail = /\*+$/.exec(selected)?.[0].length ?? 0;
    if (lead === trail && isActive(lead, marker) && to - from >= lead + trail) {
        return {
            changes: [
                { from, to: from + length, insert: "" },
                { from: to - length, to, insert: "" },
            ],
            range: { from, to: to - 2 * length },
        };
    }

    if (to > from) {
        return {
            changes: [
                { from, to: from, insert: marker },
                { from: to, to, insert: marker },
            ],
            range: { from: from + length, to: to + length },
        };
    }
    return {
        changes: [{ from, to: from, insert: marker + marker }],
        range: { from: from + length, to: from + length },
    };
}

function intervalOf(edit: EmphasisEdit): TextRange {
    return {
        from: Math.min(...edit.changes.map((c) => c.from)),
        to: Math.max(...edit.changes.map((c) => c.to)),
    };
}

function toggle(marker: EmphasisMarker): Command {
    return (view) => {
        const { state } = view;
        if (state.readOnly) return false;
        if (view.compositionStarted || view.composing) return true;

        const text = state.doc.toString();
        const main = state.selection.main;
        const ordered = [
            main,
            ...state.selection.ranges.filter((range) => range !== main),
        ];
        const accepted = new Map<SelectionRange, EmphasisEdit>();
        const taken: TextRange[] = [];
        for (const range of ordered) {
            const edit = computeEmphasisToggle(text, range, marker);
            if (!edit) continue;
            const interval = intervalOf(edit);
            if (
                taken.some(
                    (other) =>
                        interval.from <= other.to && other.from <= interval.to,
                )
            )
                continue;
            taken.push(interval);
            accepted.set(range, edit);
        }
        if (accepted.size === 0) return true;

        const transaction = state.update(
            state.changeByRange((range) => {
                const edit = accepted.get(range);
                if (!edit) return { range };
                return {
                    changes: edit.changes as ChangeSpec[],
                    range: EditorSelection.range(
                        edit.range.from,
                        edit.range.to,
                    ),
                };
            }),
            {
                userEvent: "input.format",
                annotations: isolateHistory.of("full"),
            },
        );
        view.dispatch(transaction);
        return true;
    };
}

export const toggleBold: Command = toggle("**");
export const toggleItalic: Command = toggle("*");

export const emphasisKeymap: readonly KeyBinding[] = [
    { key: "Mod-b", run: toggleBold },
    { key: "Mod-i", run: toggleItalic },
];
