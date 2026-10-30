import type { NoteListEntry } from "../../src/product/NoteList";

export const workspaceName = "Personal notes";

export const sampleNotes: NoteListEntry[] = [
    { path: "Ideas.md", name: "Ideas" },
    { path: "Meeting notes.md", name: "Meeting notes" },
    { path: "projects/Roadmap.md", name: "Roadmap" },
    { path: "projects/Sync server spec.md", name: "Sync server spec" },
    { path: "Reading list.md", name: "Reading list" },
    { path: "Shopping.md", name: "Shopping" },
    { path: "Weekly plan.md", name: "Weekly plan" },
];

export function manyNotes(count: number): NoteListEntry[] {
    return Array.from({ length: count }, (_, index) => {
        const day = String((index % 28) + 1).padStart(2, "0");
        const month = String((Math.floor(index / 28) % 12) + 1).padStart(
            2,
            "0",
        );
        const name = `Daily ${2025 + Math.floor(index / 336)}-${month}-${day}`;
        return { path: `journal/${name}.md`, name };
    });
}

export const longNameNote: NoteListEntry = {
    path: "projects/2026/Quarterly planning notes for the whole product team including open questions.md",
    name: "Quarterly planning notes for the whole product team including open questions",
};
