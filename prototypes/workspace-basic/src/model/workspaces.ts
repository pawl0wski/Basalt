import { joinPath } from "./names";
import type { Entry, Files, Workspace, WorkspaceId } from "./types";

export const DEMO_NOW = new Date(2026, 9, 25, 14, 30, 12).getTime();

export const ROADMAP_IMAGE_SRC = "/demo-images/roadmap-diagram.svg";
export const PASTED_IMAGE_SRC = "/demo-images/pasted.svg";

const note = (text: string): Entry => ({ kind: "note", text, open: "ok" });
const folder = (): Entry => ({ kind: "folder" });

const weeklyPlan = `# Weekly plan

Review the **sync server spec** before the encryption work starts, and write down the *open questions*.

## Monday

- Check how images are stored next to notes
- Decide what the status bar shows
- Move the reading list to its own note

## Thursday

- [x] Try the app on a folder with a few hundred notes
- [ ] Compare the list speed with the old app

> Notes stay plain Markdown files, so another editor can open them.

Attachments stay in the workspace, for example \`attachments/Roadmap diagram.png\`. See the [roadmap](projects/Roadmap.md).

![Roadmap diagram](attachments/Roadmap%20diagram.png)

\`\`\`
basalt open ~/Basalt\\ notes
\`\`\`
`;

const imagesAllCases = `# Images, all cases

An existing image:

![Roadmap diagram](../attachments/Roadmap%20diagram.png)

A missing image:

![Missing](../attachments/Missing%20image.png)

An unreadable image:

![Photo 001](../attachments/Photo%20001.JPG)

An unsupported format:

![Scan](../attachments/Scan.heic)

An image that is too large:

![Huge](../attachments/Huge.png)

A corrupt image:

![Broken](../attachments/Broken.png)

A remote image:

![Logo](https://example.com/logo.png)

An Obsidian-style link without the folder:

![](Roadmap diagram.png)

An invalid link:

![Escapes](../../outside.png)

A reference-style image shows no widget:

![Reference][ref]

[ref]: ../attachments/Roadmap%20diagram.png

An HTML image shows no widget:

<img src="../attachments/Roadmap%20diagram.png" alt="Roadmap diagram">

An image link inside a code block shows no widget:

\`\`\`
![Roadmap diagram](../attachments/Roadmap%20diagram.png)
\`\`\`
`;

const w1Files = (): Files => ({
    journal: folder(),
    "journal/Daily 2026-10-18.md": note(
        "# Daily 2026-10-18\n\n- Wrote the first draft of the notes spec\n- Listed what the sync server must store\n",
    ),
    "journal/Daily 2026-10-19.md": note(
        "# Daily 2026-10-19\n\n- [x] Read the spec for images in notes\n- [ ] Decide where attachments go\n",
    ),
    projects: folder(),
    "projects/Roadmap.md": note(
        "# Roadmap\n\n## Now\n\n- Markdown notes\n- Images in notes\n- Self-hosted sync\n- Client-side end-to-end encryption\n- Offline-first\n\n## Should have\n\n- PDF annotation\n\n## Later\n\n- Whiteboards with stylus input\n",
    ),
    "projects/Sync server spec.md": note(
        "# Sync server spec\n\nThe server stores encrypted blobs only. Open questions are written down below.\n\n> Sync is not part of this prototype.\n",
    ),
    "projects/archive": folder(),
    "projects/archive/Old ideas.md": note(
        "# Old ideas\n\n- Plugins\n- Graph view\n",
    ),
    demo: folder(),
    "demo/Images, all cases.md": note(imagesAllCases),
    "demo/Big note.md": {
        kind: "note",
        text: "",
        open: "too-large",
    },
    "demo/Binary file.md": { kind: "note", text: "", open: "not-utf8" },
    attachments: folder(),
    "attachments/Roadmap diagram.png": {
        kind: "image",
        state: "ok",
        width: 1200,
        height: 800,
        src: ROADMAP_IMAGE_SRC,
    },
    "attachments/Photo 001.JPG": { kind: "image", state: "unreadable" },
    "attachments/Scan.heic": { kind: "image", state: "unsupported" },
    "attachments/Huge.png": { kind: "image", state: "too-large" },
    "attachments/Broken.png": { kind: "image", state: "corrupt" },
    "Ideas.md": note("# Ideas\n\n- A command palette\n- Note sharing\n"),
    "Meeting notes.md": note(
        "# Meeting notes\n\n## Agenda\n\n- Scope of the MVP\n- Who runs the sync server\n\n- [ ] Write down the decisions\n",
    ),
    "Reading list.md": note(
        "# Reading list\n\n- Documentation of the editor library\n- Papers on end-to-end encrypted sync\n",
    ),
    "Shopping.md": note("# Shopping\n\n- [ ] Notebook\n- [ ] Pens\n"),
    "Weekly plan.md": note(weeklyPlan),
    "Résumé ideas.md": note("# Résumé ideas\n\n- Short, one page\n"),
});

const w3Files = (): Files => ({
    "Archive index.md": note("# Archive index\n\nThis folder is read-only.\n"),
    "Old meeting notes.md": note(
        "# Old meeting notes\n\n- Nothing to change here\n",
    ),
    "Old plan.md": note("# Old plan\n\n- Archived\n"),
});

const w4Files = (): Files => {
    const files: Files = {};
    const folders = ["journal", "projects", "reference"];
    folders.forEach((name) => {
        files[name] = folder();
    });
    for (let index = 1; index <= 500; index += 1) {
        const number = String(index).padStart(3, "0");
        const dir = index % 5 === 0 ? folders[index % folders.length] : "";
        const name = `Archive note ${number} with a long descriptive name about the sync server review and encryption plan.md`;
        files[joinPath(dir, name)] = note(`# Archive note ${number}\n`);
    }
    return files;
};

export function createWorkspace(id: WorkspaceId): Workspace {
    switch (id) {
        case "W1":
            return {
                id,
                name: "Basalt notes",
                files: w1Files(),
                readOnly: false,
            };
        case "W2":
            return { id, name: "Empty notes", files: {}, readOnly: false };
        case "W3":
            return {
                id,
                name: "Read-only archive",
                files: w3Files(),
                readOnly: true,
            };
        case "W4":
            return { id, name: "Big vault", files: w4Files(), readOnly: false };
        case "W5":
            return { id, name: "Lost workspace", files: {}, readOnly: false };
    }
}

export const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
    W1: "Basalt notes",
    W2: "Empty notes",
    W3: "Read-only archive",
    W4: "Big vault",
    W5: "Lost workspace",
};
