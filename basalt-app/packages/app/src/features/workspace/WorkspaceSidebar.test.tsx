import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const notes = [
    { path: "Ideas.md", name: "Ideas" },
    { path: "projects/Roadmap.md", name: "Roadmap" },
    { path: "Welcome.md", name: "Welcome" },
];

function props(
    overrides: Partial<WorkspaceSidebarProps> = {},
): WorkspaceSidebarProps {
    return {
        workspaceName: "My notes",
        texts,
        notes,
        selectedPath: null,
        listError: null,
        createError: null,
        notice: null,
        onSelect: vi.fn(),
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

    it("lists notes in a labelled listbox and marks only the selected one", () => {
        render(<WorkspaceSidebar {...props({ selectedPath: "Ideas.md" })} />);

        const list = screen.getByRole("listbox", { name: "All notes" });
        const options = within(list).getAllByRole("option");
        expect(options.map((option) => option.textContent)).toEqual([
            "Ideas",
            "projects/Roadmap",
            "Welcome",
        ]);
        expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual([
            "true",
            "false",
            "false",
        ]);
    });

    it("selects a note on click and with Enter", async () => {
        const user = userEvent.setup();
        const p = props();
        render(<WorkspaceSidebar {...p} />);

        await user.click(screen.getByRole("option", { name: "Ideas" }));
        screen.getByRole("option", { name: "Welcome" }).focus();
        await user.keyboard("{Enter}");

        expect(p.onSelect).toHaveBeenNthCalledWith(1, "Ideas.md");
        expect(p.onSelect).toHaveBeenNthCalledWith(2, "Welcome.md");
    });

    it("moves focus with the arrow keys, wrapping at both ends", async () => {
        const user = userEvent.setup();
        render(<WorkspaceSidebar {...props({ selectedPath: "Ideas.md" })} />);
        const [first, second, third] = screen.getAllByRole("option");

        first?.focus();
        await user.keyboard("{ArrowDown}");
        expect(second).toHaveFocus();
        await user.keyboard("{ArrowDown}{ArrowDown}");
        expect(first).toHaveFocus();
        await user.keyboard("{ArrowUp}");
        expect(third).toHaveFocus();
    });

    it("shows the empty state with a create action for an empty workspace", async () => {
        const user = userEvent.setup();
        const p = props({ notes: [] });
        render(<WorkspaceSidebar {...p} />);

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
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
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
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
