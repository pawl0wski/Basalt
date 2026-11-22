import "@testing-library/jest-dom/vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { AppContainer } from "../app/AppContainer";
import { createHarness, root, seedFs } from "../test-harness";

afterEach(async () => {
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 5));
});

const A = root("/home/me/Basalt notes");

async function openApp(
    files: Record<string, string>,
    options: Parameters<typeof seedFs>[1] = {},
) {
    const fs = seedFs(files, options);
    const harness = createHarness({
        workspaces: { [A]: fs },
        settings: { version: 1, lastWorkspace: A, workspaces: {} },
    });
    render(
        <ServicesProvider services={harness}>
            <AppContainer />
        </ServicesProvider>,
    );
    await screen.findByRole("tree", { name: en.workspace.notesLabel });
    return { harness, fs };
}

const row = (name: string) => screen.getByRole("treeitem", { name });
const menuItems = () =>
    within(screen.getByRole("menu")).getAllByRole("menuitem");

async function paths(fs: ReturnType<typeof seedFs>) {
    const listed = await fs.list();
    return listed.ok ? listed.value.map((entry) => entry.path).sort() : [];
}

describe("the notes tree context menu", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("offers Rename and Delete on a note", async () => {
        await openApp({ "a.md": "" });

        fireEvent.contextMenu(row("a"));

        expect(await screen.findByRole("menu")).toBeInTheDocument();
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.rename,
            en.tree.menu.delete,
        ]);
    });

    it("offers New note, New folder, Rename and Delete on a folder", async () => {
        await openApp({ "docs/a.md": "" });

        fireEvent.contextMenu(row("docs"));

        await screen.findByRole("menu");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.newNote,
            en.tree.menu.newFolder,
            en.tree.menu.rename,
            en.tree.menu.delete,
        ]);
    });

    it("offers New note and New folder on the empty area of the tree", async () => {
        await openApp({ "a.md": "" });

        fireEvent.contextMenu(screen.getByRole("tree"));

        await screen.findByRole("menu");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.newNote,
            en.tree.menu.newFolder,
        ]);
    });

    it("offers the root menu in an empty workspace", async () => {
        const fs = seedFs({});
        const harness = createHarness({
            workspaces: { [A]: fs },
            settings: { version: 1, lastWorkspace: A, workspaces: {} },
        });
        render(
            <ServicesProvider services={harness}>
                <AppContainer />
            </ServicesProvider>,
        );
        const empty = await screen.findByText(en.workspace.empty.title);

        fireEvent.contextMenu(empty);

        await screen.findByRole("menu");
        expect(menuItems()).toHaveLength(2);
    });

    it.each([
        ["Shift+F10", "{Shift>}{F10}{/Shift}"],
        ["the Menu key", "{ContextMenu}"],
    ])("opens for the focused row with %s", async (_label, keys) => {
        const user = userEvent.setup();
        await openApp({ "a.md": "", "b.md": "" });
        row("b").focus();

        await user.keyboard(keys);

        await screen.findByRole("menu");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.rename,
            en.tree.menu.delete,
        ]);
    });

    it("has no button inside any row", async () => {
        await openApp({ "docs/a.md": "", "b.md": "" });

        for (const item of screen.getAllByRole("treeitem")) {
            expect(within(item).queryByRole("button")).toBeNull();
        }
    });

    it("returns focus to the row when closed with Escape", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "", "b.md": "" });
        row("b").focus();
        await user.keyboard("{Shift>}{F10}{/Shift}");
        await screen.findByRole("menu");

        await user.keyboard("{Escape}");

        await vi.waitFor(() => {
            expect(screen.queryByRole("menu")).toBeNull();
            expect(row("b")).toHaveFocus();
        });
    });

    it("creates Untitled in the folder from New note and opens it", async () => {
        const user = userEvent.setup();
        const { harness, fs } = await openApp({ "docs/a.md": "" });
        fireEvent.contextMenu(row("docs"));
        await screen.findByRole("menu");

        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.newNote }),
        );

        await vi.waitFor(() => {
            expect(harness.notesStore.getState().activeNote).toBe(
                "docs/Untitled.md",
            );
        });
        expect(await paths(fs)).toContain("docs/Untitled.md");
        expect(
            await screen.findByRole("treeitem", { name: "Untitled" }),
        ).toBeInTheDocument();
    });
});

describe("the new folder dialog", () => {
    beforeAll(async () => {
        await initI18n();
    });

    async function openDialog(target: string | null) {
        const user = userEvent.setup();
        const app = await openApp({ "docs/a.md": "", "Ideas.md": "" });
        if (target === null) fireEvent.contextMenu(screen.getByRole("tree"));
        else fireEvent.contextMenu(row(target));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.newFolder }),
        );
        const dialog = await screen.findByRole("dialog", {
            name: en.tree.newFolder.title,
        });
        return { user, dialog, ...app };
    }

    it("creates the folder in the root and shows it", async () => {
        const { user, fs } = await openDialog(null);

        await user.keyboard("Archive{Enter}");

        await vi.waitFor(async () => {
            expect(await paths(fs)).toContain("Archive");
        });
        expect(
            await screen.findByRole("treeitem", { name: "Archive" }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("creates the folder inside the folder it was opened on", async () => {
        const { user, fs } = await openDialog("docs");

        await user.keyboard("2026{Enter}");

        await vi.waitFor(async () => {
            expect(await paths(fs)).toContain("docs/2026");
        });
        expect(
            await screen.findByRole("treeitem", { name: "2026" }),
        ).toBeInTheDocument();
    });

    it("closes the new-folder dialog and toasts a collision without writing", async () => {
        const { user, dialog, fs } = await openDialog(null);
        const before = await paths(fs);

        await user.keyboard("DOCS");

        await user.click(
            within(dialog).getByRole("button", {
                name: en.tree.newFolder.submit,
            }),
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        const region = screen.getByRole("region", { name: /Notifications/ });
        expect(
            await within(region).findByText(en.errors["already-exists"]),
        ).toBeVisible();
        expect(await paths(fs)).toEqual(before);
    });

    it("shows the separator message inline", async () => {
        const { user, dialog } = await openDialog(null);

        await user.keyboard("a/b");

        expect(
            within(dialog).getByText(en.tree.nameError.separator),
        ).toBeInTheDocument();
    });

    it("shows the read-only message in the dialog and creates nothing", async () => {
        const user = userEvent.setup();
        const { fs } = await openApp({ "a.md": "" }, { readOnly: true });
        fireEvent.contextMenu(screen.getByRole("tree"));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.newFolder }),
        );
        await screen.findByRole("dialog");

        await user.keyboard("Archive{Enter}");

        expect(
            await screen.findByText(en.errors["permission-denied"]),
        ).toBeInTheDocument();
        expect(await paths(fs)).toEqual(["a.md"]);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

describe("the rename dialog", () => {
    beforeAll(async () => {
        await initI18n();
    });

    async function openRename(note: string, files: Record<string, string>) {
        const user = userEvent.setup();
        const app = await openApp(files);
        fireEvent.contextMenu(row(note));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.rename }),
        );
        const dialog = await screen.findByRole("dialog", {
            name: en.tree.rename.title,
        });
        return { user, dialog, ...app };
    }

    it("starts with the current name selected and renames on Enter, keeping the note open", async () => {
        const { user, fs, harness } = await openRename("old", {
            "old.md": "# Keep",
        });
        await harness.notesActions.openNote("old.md" as never);
        const input = screen.getByRole("textbox", {
            name: en.tree.rename.nameLabel,
        });
        expect(input).toHaveValue("old");

        await user.keyboard("fresh{Enter}");

        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual(["fresh.md"]);
        });
        expect(harness.notesStore.getState().activeNote).toBe("fresh.md");
        expect(
            await screen.findByRole("tab", { name: "fresh" }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes the rename dialog and toasts a case-only collision", async () => {
        const { user, fs } = await openRename("alpha", {
            "alpha.md": "",
            "Beta.md": "",
        });

        await user.keyboard("beta{Enter}");

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        const region = screen.getByRole("region", { name: /Notifications/ });
        expect(
            await within(region).findByText(en.errors["already-exists"]),
        ).toBeVisible();
        expect(await paths(fs)).toEqual(["Beta.md", "alpha.md"]);
    });

    it("allows a case-only change of its own name", async () => {
        const { user, fs } = await openRename("ideas", {
            "ideas.md": "",
        });

        await user.keyboard("Ideas{Enter}");
        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual(["Ideas.md"]);
        });
    });

    it("shows the separator message inline and does not rename", async () => {
        const { user, dialog, fs } = await openRename("a", { "a.md": "" });

        await user.keyboard("x/y{Enter}");

        expect(
            within(dialog).getByText(en.tree.nameError.separator),
        ).toBeInTheDocument();
        expect(await paths(fs)).toEqual(["a.md"]);
    });

    it("returns focus to the renamed row after the dialog closes", async () => {
        const { user } = await openRename("a", { "a.md": "", "b.md": "" });

        await user.keyboard("c{Enter}");

        await vi.waitFor(() => {
            expect(row("c")).toHaveFocus();
        });
    });

    it("returns focus to the row when cancelled with Escape", async () => {
        const { user } = await openRename("b", { "a.md": "", "b.md": "" });

        await user.keyboard("{Escape}");

        await vi.waitFor(() => {
            expect(screen.queryByRole("dialog")).toBeNull();
            expect(row("b")).toHaveFocus();
        });
    });

    it("shows the read-only message and leaves the file unchanged", async () => {
        const user = userEvent.setup();
        const { fs } = await openApp({ "a.md": "" }, { readOnly: true });
        fireEvent.contextMenu(row("a"));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.rename }),
        );
        await screen.findByRole("dialog");

        await user.keyboard("b{Enter}");

        expect(
            await screen.findByText(en.errors["permission-denied"]),
        ).toBeInTheDocument();
        expect(await paths(fs)).toEqual(["a.md"]);
    });
});

describe("the delete confirmation", () => {
    beforeAll(async () => {
        await initI18n();
    });

    async function openDelete(name: string) {
        const user = userEvent.setup();
        fireEvent.contextMenu(row(name));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: en.tree.menu.delete }),
        );
        return { user, dialog: await screen.findByRole("alertdialog") };
    }

    it("asks to delete the note with Cancel focused and deletes it on confirm", async () => {
        const { fs } = await openApp({ "a.md": "1", "b.md": "2" });
        const { user, dialog } = await openDelete("a");

        expect(dialog).toHaveAccessibleName('Delete "a"?');
        expect(
            within(dialog).getByRole("button", { name: en.tree.cancel }),
        ).toHaveFocus();

        await user.click(
            within(dialog).getByRole("button", {
                name: en.tree.delete.confirm,
            }),
        );

        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual(["b.md"]);
        });
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("cancelling keeps the note", async () => {
        const { fs } = await openApp({ "a.md": "1" });
        const { user, dialog } = await openDelete("a");

        await user.click(
            within(dialog).getByRole("button", { name: en.tree.cancel }),
        );

        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await paths(fs)).toEqual(["a.md"]);
    });

    it("offers Delete N notes for a multi-selection and deletes them all", async () => {
        const user = userEvent.setup();
        const { fs } = await openApp({
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
        });
        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.click(row("b"));
        await user.keyboard("{/Control}");

        fireEvent.contextMenu(row("a"));
        await screen.findByRole("menu");
        await user.click(
            screen.getByRole("menuitem", { name: "Delete 2 notes" }),
        );

        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveAccessibleName("Delete 2 notes?");
        await user.click(
            within(dialog).getByRole("button", {
                name: en.tree.delete.confirm,
            }),
        );

        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual(["c.md"]);
        });
    });

    it("shows the read-only message and deletes nothing", async () => {
        const { harness, fs } = await openApp({ "a.md": "1" });
        harness.setTrashReadOnly(true);
        const { user, dialog } = await openDelete("a");

        await user.click(
            within(dialog).getByRole("button", {
                name: en.tree.delete.confirm,
            }),
        );

        expect(
            await screen.findByText(en.errors["permission-denied"]),
        ).toBeInTheDocument();
        expect(await paths(fs)).toEqual(["a.md"]);
    });
});

describe("dragging notes in the tree", () => {
    beforeAll(async () => {
        await initI18n();
    });

    const transfer = () => ({
        dataTransfer: {
            setData: vi.fn(),
            types: [],
            files: [],
            dropEffect: "",
            effectAllowed: "",
        },
    });

    it("highlights the folder under the drag, moves the note on drop and clears the highlight", async () => {
        const { fs } = await openApp({ "a.md": "", "docs/b.md": "" });

        fireEvent.dragStart(row("a"), transfer());
        fireEvent.dragOver(row("docs"), transfer());
        expect(row("docs")).toHaveAttribute("data-drop-target", "true");
        fireEvent.drop(row("docs"), transfer());

        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual(["docs", "docs/a.md", "docs/b.md"]);
        });
        expect(row("a")).toHaveAttribute("aria-level", "2");
        expect(row("docs")).not.toHaveAttribute("data-drop-target");
    });

    it("does not highlight the own folder of the dragged note", async () => {
        const user = userEvent.setup();
        await openApp({ "docs/b.md": "" });
        await user.click(row("docs"));

        fireEvent.dragStart(row("b"), transfer());
        fireEvent.dragOver(row("docs"), transfer());

        expect(row("docs")).not.toHaveAttribute("data-drop-target");
    });

    it("shows a localised collision message in the sidebar", async () => {
        const { fs } = await openApp({ "a.md": "", "docs/A.md": "" });

        fireEvent.dragStart(row("a"), transfer());
        fireEvent.drop(row("docs"), transfer());

        expect(
            await screen.findByText(
                '"a.md" already exists in the destination. Nothing was moved.',
            ),
        ).toBeInTheDocument();
        expect(await paths(fs)).toEqual(["a.md", "docs", "docs/A.md"]);
    });
});

describe("selecting several notes in the tree", () => {
    beforeAll(async () => {
        await initI18n();
    });

    const files = { "a.md": "", "b.md": "", "c.md": "", "d.md": "" };

    it("marks the tree multiselectable and highlights Ctrl+clicked notes without opening them", async () => {
        const user = userEvent.setup();
        await openApp(files);

        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.click(row("c"));
        await user.keyboard("{/Control}");

        expect(screen.getByRole("tree")).toHaveAttribute(
            "aria-multiselectable",
            "true",
        );
        expect(row("a")).toHaveAttribute("aria-selected", "true");
        expect(row("b")).toHaveAttribute("aria-selected", "false");
        expect(row("c")).toHaveAttribute("aria-selected", "true");
        expect(screen.queryByRole("tab")).toBeNull();
    });

    it("selects the range with Shift+click, extends with Shift+Arrow and clears with Escape", async () => {
        const user = userEvent.setup();
        await openApp(files);
        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.keyboard("{/Control}{Shift>}");
        await user.click(row("c"));
        await user.keyboard("{/Shift}");
        expect(
            screen
                .getAllByRole("treeitem")
                .map((item) => item.getAttribute("aria-selected")),
        ).toEqual(["true", "true", "true", "false"]);

        row("c").focus();
        await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
        expect(row("d")).toHaveAttribute("aria-selected", "true");

        await user.keyboard("{Escape}");
        expect(
            screen
                .getAllByRole("treeitem")
                .map((item) => item.getAttribute("aria-selected")),
        ).toEqual(["false", "false", "false", "false"]);
    });

    it("a plain click opens one note and clears the selection", async () => {
        const user = userEvent.setup();
        await openApp(files);
        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.click(row("b"));
        await user.keyboard("{/Control}");

        await user.click(row("c"));

        expect(await screen.findByRole("tab", { name: "c" })).toBeVisible();
        expect(row("a")).toHaveAttribute("aria-selected", "false");
        expect(row("b")).toHaveAttribute("aria-selected", "false");
    });

    it("never selects a folder", async () => {
        const user = userEvent.setup();
        await openApp({ "docs/x.md": "", "a.md": "" });

        await user.keyboard("{Control>}");
        await user.click(row("docs"));
        await user.keyboard("{/Control}");

        expect(row("docs")).not.toHaveAttribute("aria-selected");
        expect(row("docs")).toHaveAttribute("aria-expanded", "true");
    });

    it("offers Delete N notes on a note of a multi-selection and the note menu on an unselected note", async () => {
        const user = userEvent.setup();
        await openApp(files);
        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.click(row("b"));
        await user.keyboard("{/Control}");

        fireEvent.contextMenu(row("a"));
        await screen.findByRole("menu");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            "Delete 2 notes",
        ]);

        fireEvent.contextMenu(row("c"));
        await screen.findByRole("menu");
        expect(row("a")).toHaveAttribute("aria-selected", "false");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.rename,
            en.tree.menu.delete,
        ]);
    });

    it("dragging a selected note moves the whole selection", async () => {
        const user = userEvent.setup();
        const { fs } = await openApp({ ...files, "docs/x.md": "" });
        await user.keyboard("{Control>}");
        await user.click(row("a"));
        await user.click(row("b"));
        await user.keyboard("{/Control}");
        const dataTransfer = {
            setData: vi.fn(),
            types: [],
            files: [],
            dropEffect: "",
            effectAllowed: "",
        };

        fireEvent.dragStart(row("a"), { dataTransfer });
        expect(row("b")).toHaveAttribute("data-dragging", "true");
        fireEvent.drop(row("docs"), { dataTransfer });

        await vi.waitFor(async () => {
            expect(await paths(fs)).toEqual([
                "c.md",
                "d.md",
                "docs",
                "docs/a.md",
                "docs/b.md",
                "docs/x.md",
            ]);
        });
    });
});
