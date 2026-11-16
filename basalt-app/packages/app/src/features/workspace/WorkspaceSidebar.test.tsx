import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TreeNode } from "@basalt/ui";
import { describe, expect, it, vi } from "vitest";
import {
    WorkspaceSidebar,
    type WorkspaceSidebarProps,
    type WorkspaceSidebarTexts,
} from "./WorkspaceSidebar";

const texts: WorkspaceSidebarTexts = {
    sidebarLabel: "Folder",
    newNote: "Add note",
    notesLabel: "All notes",
    emptyTitle: "Nothing here",
    emptyDescription: "No files yet.",
    emptyAction: "Start writing",
    listErrorTitle: "Cannot read",
    retry: "Again",
};

function nodesWith(expanded: boolean): TreeNode[] {
    return [
        {
            kind: "folder",
            id: "projects",
            name: "projects",
            expanded,
            children: [
                { kind: "note", id: "projects/Roadmap.md", name: "Roadmap" },
            ],
        },
        { kind: "note", id: "Ideas.md", name: "Ideas" },
        { kind: "note", id: "Welcome.md", name: "Welcome" },
    ];
}

function props(
    overrides: Partial<WorkspaceSidebarProps> = {},
): WorkspaceSidebarProps {
    return {
        workspaceName: "My notes",
        texts,
        nodes: nodesWith(false),
        activeId: null,
        focusedId: null,
        listError: null,
        createError: null,
        notice: null,
        onOpenNote: vi.fn(),
        onToggleFolder: vi.fn(),
        onFocusChange: vi.fn(),
        onNewNote: vi.fn(),
        onRetry: vi.fn(),
        ...overrides,
    };
}

describe("WorkspaceSidebar", () => {
    it("shows the folder name and a labelled New note button, without Change workspace", async () => {
        const user = userEvent.setup();
        const p = props();
        render(<WorkspaceSidebar {...p} />);

        const nav = screen.getByRole("navigation", { name: "Folder" });
        expect(within(nav).getByText("My notes")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Add note" }));
        expect(p.onNewNote).toHaveBeenCalledOnce();
        expect(
            screen.queryByRole("button", { name: /change workspace/i }),
        ).not.toBeInTheDocument();
    });

    it("shows a labelled tree with folders first and the active note marked", () => {
        render(<WorkspaceSidebar {...props({ activeId: "Ideas.md" })} />);

        const tree = screen.getByRole("tree", { name: "All notes" });
        const rows = within(tree).getAllByRole("treeitem");
        expect(rows.map((row) => row.textContent)).toEqual([
            "projects",
            "Ideas",
            "Welcome",
        ]);
        expect(
            rows.map((row) => row.getAttribute("aria-current") === "true"),
        ).toEqual([false, true, false]);
    });

    it("shows a note of an expanded folder by its name under the folder, with the same row height as top-level rows", () => {
        render(<WorkspaceSidebar {...props({ nodes: nodesWith(true) })} />);

        const nested = screen.getByRole("treeitem", { name: "Roadmap" });
        const top = screen.getByRole("treeitem", { name: "Ideas" });
        expect(nested).toHaveAttribute("aria-level", "2");
        expect(nested.textContent).toBe("Roadmap");
        expect(nested.className).toBe(top.className);
    });

    it("hides the notes of a collapsed folder", () => {
        render(<WorkspaceSidebar {...props()} />);

        expect(
            screen.queryByRole("treeitem", { name: "Roadmap" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("treeitem", { name: "projects" }),
        ).toHaveAttribute("aria-expanded", "false");
    });

    it("opens a note on click and with Enter, and toggles a folder", async () => {
        const user = userEvent.setup();
        const p = props();
        render(<WorkspaceSidebar {...p} />);

        await user.click(screen.getByRole("treeitem", { name: "Ideas" }));
        screen.getByRole("treeitem", { name: "Welcome" }).focus();
        await user.keyboard("{Enter}");
        await user.click(screen.getByRole("treeitem", { name: "projects" }));

        expect(p.onOpenNote).toHaveBeenNthCalledWith(1, "Ideas.md");
        expect(p.onOpenNote).toHaveBeenNthCalledWith(2, "Welcome.md");
        expect(p.onToggleFolder).toHaveBeenCalledWith("projects");
    });

    it("moves focus with the arrow keys and reports the focused row", async () => {
        const user = userEvent.setup();
        const p = props();
        render(<WorkspaceSidebar {...p} />);

        screen.getByRole("treeitem", { name: "projects" }).focus();
        await user.keyboard("{ArrowDown}");

        expect(screen.getByRole("treeitem", { name: "Ideas" })).toHaveFocus();
        expect(p.onFocusChange).toHaveBeenLastCalledWith("Ideas.md");
    });

    it("shows a folder-only workspace as a tree, not as the empty state", () => {
        const folderOnly: TreeNode[] = [
            {
                kind: "folder",
                id: "empty",
                name: "empty",
                expanded: false,
                children: [],
            },
        ];
        render(<WorkspaceSidebar {...props({ nodes: folderOnly })} />);

        expect(
            screen.getByRole("treeitem", { name: "empty" }),
        ).toBeInTheDocument();
        expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
    });

    it("shows the empty state with a create action for an empty workspace", async () => {
        const user = userEvent.setup();
        const p = props({ nodes: [] });
        render(<WorkspaceSidebar {...p} />);

        expect(screen.queryByRole("tree")).not.toBeInTheDocument();
        expect(screen.getByText("Nothing here")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Start writing" }));
        expect(p.onNewNote).toHaveBeenCalledOnce();
    });

    it("shows an error state with Retry instead of the list", async () => {
        const user = userEvent.setup();
        const p = props({ listError: "Could not list." });
        render(<WorkspaceSidebar {...p} />);

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Cannot read");
        expect(alert).toHaveTextContent("Could not list.");
        expect(screen.queryByRole("tree")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Again" }));
        expect(p.onRetry).toHaveBeenCalledOnce();
    });

    it("shows the notice and the create error only when given", () => {
        const { rerender } = render(<WorkspaceSidebar {...props()} />);
        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        rerender(
            <WorkspaceSidebar
                {...props({
                    notice: "Refreshes on focus.",
                    createError: "Read-only.",
                })}
            />,
        );
        const statuses = screen.getAllByRole("status");
        expect(statuses.map((s) => s.textContent)).toEqual([
            "Refreshes on focus.",
            "Read-only.",
        ]);
    });
});
