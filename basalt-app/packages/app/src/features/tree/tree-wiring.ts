import type { NotesStore } from "../notes/notes-store";
import { ancestorFolders } from "./tree-nodes";
import { expandFolders, type TreeStore } from "./tree-store";

export function connectTreeStore(options: {
    readonly tree: TreeStore;
    readonly notes: NotesStore;
}): () => void {
    const { tree, notes } = options;
    return notes.subscribe((state, previous) => {
        if (
            state.activeNote === null ||
            state.activeNote === previous.activeNote
        )
            return;
        expandFolders(tree, ancestorFolders(state.activeNote));
    });
}
