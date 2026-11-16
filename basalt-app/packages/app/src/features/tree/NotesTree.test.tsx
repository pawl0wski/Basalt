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

    it("offers Rename on a note", async () => {
        await openApp({ "a.md": "" });

        fireEvent.contextMenu(row("a"));

        expect(await screen.findByRole("menu")).toBeInTheDocument();
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.rename,
        ]);
    });

    it("offers New note and New folder on a folder", async () => {
        await openApp({ "docs/a.md": "" });

        fireEvent.contextMenu(row("docs"));

        await screen.findByRole("menu");
        expect(menuItems().map((item) => item.textContent)).toEqual([
            en.tree.menu.newNote,
            en.tree.menu.newFolder,
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

    it("shows a collision inline, disables Create folder and writes nothing", async () => {
        const { user, dialog, fs } = await openDialog(null);
        const before = await paths(fs);

        await user.keyboard("DOCS");

        expect(
            within(dialog).getByText(en.tree.nameError.collision),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole("button", {
                name: en.tree.newFolder.submit,
            }),
        ).toBeDisabled();
        await user.keyboard("{Enter}");
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

    it("shows collisions inline, also for a case-only difference", async () => {
        const { user, dialog, fs } = await openRename("alpha", {
            "alpha.md": "",
            "Beta.md": "",
        });

        await user.keyboard("beta");

        expect(
            within(dialog).getByText(en.tree.nameError.collision),
        ).toBeInTheDocument();
        await user.keyboard("{Enter}");
        expect(await paths(fs)).toEqual(["Beta.md", "alpha.md"]);
    });

    it("allows a case-only change of its own name", async () => {
        const { user, dialog, fs } = await openRename("ideas", {
            "ideas.md": "",
        });

        await user.keyboard("Ideas");

        expect(
            within(dialog).queryByText(en.tree.nameError.collision),
        ).toBeNull();
        await user.keyboard("{Enter}");
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
