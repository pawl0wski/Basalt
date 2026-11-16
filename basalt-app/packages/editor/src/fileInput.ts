import {
    type EditorState,
    type Extension,
    Prec,
    StateEffect,
    StateField,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export interface FileInputOptions {
    onFiles(
        files: readonly File[],
        source: "paste" | "drop",
    ): Promise<readonly string[]>;
}

type Pending = { id: number; from: number; to: number };

const addPending = StateEffect.define<Pending>();
const removePending = StateEffect.define<number>();

const pendingField = StateField.define<readonly Pending[]>({
    create: () => [],
    update(value, transaction) {
        let next = value;
        if (transaction.docChanged) {
            next = next.map((entry) => ({
                id: entry.id,
                from: transaction.changes.mapPos(entry.from, -1),
                to: transaction.changes.mapPos(entry.to, 1),
            }));
        }
        for (const effect of transaction.effects) {
            if (effect.is(addPending)) next = [...next, effect.value];
            if (effect.is(removePending)) {
                next = next.filter((entry) => entry.id !== effect.value);
            }
        }
        return next;
    },
});

export function linksInsertion(
    state: EditorState,
    from: number,
    to: number,
    links: readonly string[],
): string {
    if (links.length === 1) return links[0] ?? "";
    const atLineStart = state.doc.lineAt(from).from === from;
    const atLineEnd = state.doc.lineAt(to).to === to;
    return `${atLineStart ? "" : "\n"}${links.join("\n")}${atLineEnd ? "" : "\n"}`;
}

function hasFiles(transfer: DataTransfer | null): transfer is DataTransfer {
    return transfer !== null && transfer.files.length > 0;
}

export function createFileInput(options: FileInputOptions): Extension {
    let nextId = 0;

    function start(
        view: EditorView,
        files: readonly File[],
        source: "paste" | "drop",
        from: number,
        to: number,
    ) {
        const id = nextId++;
        view.dispatch({ effects: addPending.of({ id, from, to }) });
        void options.onFiles(files, source).then(
            (links) => finish(view, id, links),
            () => finish(view, id, []),
        );
    }

    function finish(view: EditorView, id: number, links: readonly string[]) {
        if (!view.dom.isConnected) return;
        const entry = view.state
            .field(pendingField, false)
            ?.find((candidate) => candidate.id === id);
        if (!entry) return;
        if (links.length === 0) {
            view.dispatch({ effects: removePending.of(id) });
            return;
        }
        const insert = linksInsertion(view.state, entry.from, entry.to, links);
        view.dispatch({
            changes: { from: entry.from, to: entry.to, insert },
            selection: { anchor: entry.from + insert.length },
            effects: removePending.of(id),
            userEvent: "input.paste",
        });
    }

    return [
        pendingField,
        Prec.highest(
            EditorView.domEventHandlers({
                paste(event, view) {
                    const transfer = event.clipboardData;
                    if (!hasFiles(transfer) || view.state.readOnly)
                        return false;
                    if (transfer.getData("text/plain") !== "") return false;
                    event.preventDefault();
                    const { from, to } = view.state.selection.main;
                    start(view, [...transfer.files], "paste", from, to);
                    return true;
                },
                dragover(event) {
                    if (event.dataTransfer?.types.includes("Files")) {
                        event.preventDefault();
                    }
                    return false;
                },
                drop(event, view) {
                    const transfer = event.dataTransfer;
                    if (!hasFiles(transfer)) return false;
                    event.preventDefault();
                    if (view.state.readOnly) return true;
                    const position =
                        view.posAtCoords({
                            x: event.clientX,
                            y: event.clientY,
                        }) ?? view.state.selection.main.head;
                    start(
                        view,
                        [...transfer.files],
                        "drop",
                        position,
                        position,
                    );
                    return true;
                },
            }),
        ),
    ];
}
