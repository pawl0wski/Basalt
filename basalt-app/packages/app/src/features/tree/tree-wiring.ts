import type { NotesStore } from "../notes/notes-store";
import type { WorkspaceStore } from "../workspace/workspace-store";
import { ancestorFolders } from "./tree-nodes";
import { emptyTreeState, expandFolders, type TreeStore } from "./tree-store";

export function connectTreeStore(options: {
    readonly tree: TreeStore;
    readonly notes: NotesStore;
    readonly workspace: WorkspaceStore;
}): () => void {
    const { tree, notes, workspace } = options;
    const stopNotes = notes.subscribe((state, previous) => {
        if (
            state.activeNote === null ||
            state.activeNote === previous.activeNote
        )
            return;
        expandFolders(tree, ancestorFolders(state.activeNote));
    });
    const stopWorkspace = workspace.subscribe((state, previous) => {
        if (state.root !== previous.root) tree.setState(emptyTreeState());
    });
    return () => {
        stopNotes();
        stopWorkspace();
    };
}
