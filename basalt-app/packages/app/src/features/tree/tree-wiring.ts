import type { NotesStore } from "../notes/notes-store";
import { ancestorFolders } from "./tree-nodes";
import { expandFolders, pruneSelection, type TreeStore } from "./tree-store";

export function connectTreeStore(options: {
    readonly tree: TreeStore;
    readonly notes: NotesStore;
}): () => void {
    const { tree, notes } = options;
    return notes.subscribe((state, previous) => {
        if (
            state.notes !== previous.notes &&
            tree.getState().selected.size > 0
        ) {
            const paths = new Set<string>(state.notes.map((note) => note.path));
            pruneSelection(tree, (id) => paths.has(id));
        }
        if (
            state.activeNote === null ||
            state.activeNote === previous.activeNote
        )
            return;
        expandFolders(tree, ancestorFolders(state.activeNote));
    });
}
