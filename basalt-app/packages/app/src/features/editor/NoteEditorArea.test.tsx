import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView } from "@codemirror/view";
import { beforeAll, describe, expect, it } from "vitest";
import { MAX_NOTE_BYTES, defaultAppSettings } from "@basalt/core";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";
import { AppContainer } from "../app/AppContainer";

const A = root("/home/me/Notes");

async function openApp(
    files: Record<string, string>,
    prepare: (fs: ReturnType<typeof seedFs>) => void = () => undefined,
    settings = defaultAppSettings(),
) {
    const fs = seedFs(files);
    prepare(fs);
    const harness = createHarness({
        workspaces: { [A]: fs },
        settings: { ...settings, lastWorkspace: A },
    });
    render(
        <ServicesProvider services={harness}>
            <AppContainer />
        </ServicesProvider>,
    );
    await screen.findByRole("navigation", { name: en.workspace.sidebarLabel });
    await settle();
    return { harness, fs };
}

function tabs() {
    return screen.queryAllByRole("tab");
}

function viewOf(name: string): EditorView {
    const view = EditorView.findFromDOM(
        screen.getByRole("textbox", { name, hidden: true }).parentElement
            ?.parentElement ?? document.body,
    );
    if (!view) throw new Error("no editor view");
    return view;
}

function typeInto(name: string, insert: string) {
    const view = viewOf(name);
    view.dispatch({ changes: { from: view.state.doc.length, insert } });
}

function listOption(name: string | RegExp) {
    return within(
        screen.getByRole("tree", { name: en.workspace.notesLabel }),
    ).getByRole("treeitem", { name });
}

describe("editor area and tabs", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("keeps the empty state while no tab is open", async () => {
        await openApp({ "a.md": "x" });

        expect(screen.getByText(en.workspace.noNote.title)).toBeInTheDocument();
        expect(tabs()).toHaveLength(0);
        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("opens a note from the list in a focused editor with a selected tab", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "# Alpha", "b.md": "Beta" });

        await user.click(listOption("a"));

        const editor = await screen.findByRole("textbox", { name: "a" });
        expect(editor).toHaveTextContent("# Alpha");
        await waitFor(() => {
            expect(editor).toHaveFocus();
        });
        expect(screen.getByRole("tab", { name: "a" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        expect(
            screen.queryByText(en.workspace.noNote.title),
        ).not.toBeInTheDocument();
        expect(document.querySelectorAll(".cm-editor")).toHaveLength(1);
    });

    it("uses only the CodeMirror editor, with no separate input or source panel", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "# Alpha" });

        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });

        expect(screen.getAllByRole("textbox")).toHaveLength(1);
        expect(document.querySelector("textarea, input")).toBeNull();
    });

    it("titles tabs by file name without extension and opens several", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1", "projects/Roadmap.md": "2" });

        await user.click(listOption("a"));
        await user.click(listOption("projects"));
        await user.click(listOption(/Roadmap/));

        expect(tabs().map((tab) => tab.textContent)).toEqual(["a", "Roadmap"]);
        expect(screen.getByRole("tab", { name: "Roadmap" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });

    it("focuses the existing tab and editor when an open note is clicked again", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1", "b.md": "2" });
        await user.click(listOption("a"));
        await user.click(listOption("b"));

        await user.click(listOption("a"));

        expect(tabs()).toHaveLength(2);
        expect(screen.getByRole("tab", { name: "a" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await waitFor(() => {
            expect(screen.getByRole("textbox", { name: "a" })).toHaveFocus();
        });
    });

    it("switches tabs without remounting editors and keeps the undo history", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1", "b.md": "2" });
        await user.click(listOption("a"));
        await user.click(listOption("b"));
        const viewA = viewOf("a");
        typeInto("a", "x");

        await user.click(screen.getByRole("tab", { name: /^a/ }));
        await user.click(screen.getByRole("tab", { name: "b" }));
        await user.click(screen.getByRole("tab", { name: /^a/ }));

        expect(viewOf("a")).toBe(viewA);
        expect(viewA.state.doc.toString()).toBe("1x");
        expect(document.querySelectorAll(".cm-editor")).toHaveLength(2);
        expect(
            screen.getByRole("textbox", { name: "b", hidden: true }),
        ).not.toBeVisible();
    });

    it("typing makes the tab unsaved and autosave clears it and writes the text", async () => {
        const user = userEvent.setup();
        const { harness, fs } = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });

        typeInto("a", " more");

        await screen.findByRole("tab", { name: "a not saved" });
        expect(document.querySelector("[data-unsaved-dot]")).not.toBeNull();
        harness.scheduler.fire();
        await settle();
        await waitFor(() => {
            expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
        });
        expect(document.querySelector("[data-unsaved-dot]")).toBeNull();
        const saved = fs.getState().entries.find((e) => e.path === "a.md");
        expect(saved && "base64" in saved ? atob(saved.base64) : null).toBe(
            "base more",
        );
    });

    it("closes a tab with its button and with the middle mouse button", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1", "b.md": "2" });
        await user.click(listOption("a"));
        await user.click(listOption("b"));

        await user.click(screen.getByRole("button", { name: "Close b" }));
        await waitFor(() => {
            expect(tabs().map((tab) => tab.textContent)).toEqual(["a"]);
        });
        await user.pointer({
            keys: "[MouseMiddle]",
            target: screen.getByRole("tab", { name: "a" }),
        });

        await waitFor(() => {
            expect(tabs()).toHaveLength(0);
        });
        expect(screen.getByText(en.workspace.noNote.title)).toBeInTheDocument();
    });

    it("flushes the text before closing a dirty tab", async () => {
        const user = userEvent.setup();
        const { fs } = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");

        await user.click(screen.getByRole("button", { name: "Close a" }));

        await waitFor(() => {
            expect(tabs()).toHaveLength(0);
        });
        const saved = fs.getState().entries.find((e) => e.path === "a.md");
        expect(saved && "base64" in saved ? atob(saved.base64) : null).toBe(
            "base!",
        );
    });

    it("keeps the tab open when the flush on close fails", async () => {
        const user = userEvent.setup();
        const fs = seedFs({ "a.md": "base" });
        const harness = createHarness({
            workspaces: { [A]: fs },
            settings: { ...defaultAppSettings(), lastWorkspace: A },
        });
        render(
            <ServicesProvider services={harness}>
                <AppContainer />
            </ServicesProvider>,
        );
        await screen.findByRole("navigation", {
            name: en.workspace.sidebarLabel,
        });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");
        fs.failNextWrite();

        await user.click(screen.getByRole("button", { name: "Close a" }));
        await settle();

        expect(screen.getAllByRole("tab", { hidden: true })).toHaveLength(1);
        expect(
            screen.getByRole("textbox", { name: "a", hidden: true }),
        ).toBeInTheDocument();
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("moves between tabs with the arrow keys", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1", "b.md": "2", "c.md": "3" });
        await user.click(listOption("a"));
        await user.click(listOption("b"));
        await user.click(listOption("c"));

        screen.getByRole("tab", { name: "c" }).focus();
        await user.keyboard("{ArrowLeft}");

        expect(screen.getByRole("tab", { name: "b" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        expect(screen.getByRole("tab", { name: "b" })).toHaveFocus();
        await user.keyboard("{ArrowRight}{ArrowRight}");
        expect(screen.getByRole("tab", { name: "a" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        expect(screen.getByRole("textbox", { name: "a" })).toBeVisible();
    });

    it("New note opens an editor with the cursor in it", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "1" });

        await user.click(
            within(
                screen.getByRole("navigation", {
                    name: en.workspace.sidebarLabel,
                }),
            ).getByRole("button", { name: en.workspace.newNote }),
        );

        const editor = await screen.findByRole("textbox", {
            name: en.notes.untitled,
        });
        await waitFor(() => {
            expect(editor).toHaveFocus();
        });
        expect(
            screen.getByRole("tab", { name: en.notes.untitled }),
        ).toHaveAttribute("aria-selected", "true");
    });

    it("restores tabs and the active tab on launch and drops missing notes", async () => {
        await openApp({ "a.md": "1", "b.md": "2" }, () => undefined, {
            ...defaultAppSettings(),
            workspaces: {
                [A]: {
                    openNotes: [
                        wsPath("gone.md"),
                        wsPath("a.md"),
                        wsPath("b.md"),
                    ],
                    activeNote: wsPath("b.md"),
                },
            },
        });

        expect(tabs().map((tab) => tab.textContent)).toEqual(["a", "b"]);
        expect(screen.getByRole("tab", { name: "b" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        expect(screen.getByRole("textbox", { name: "b" })).toBeVisible();
        expect(
            screen.getByRole("textbox", { name: "a", hidden: true }),
        ).not.toBeVisible();
        expect(screen.getByRole("textbox", { name: "b" })).not.toHaveFocus();
    });

    describe("note errors", () => {
        it("shows the too-large message, mounts no editor and writes nothing", async () => {
            const user = userEvent.setup();
            const { fs } = await openApp({ "ok.md": "x" }, (seeded) => {
                seeded.externalWrite(
                    wsPath("big.md"),
                    new Uint8Array(MAX_NOTE_BYTES + 1),
                );
            });
            const before = JSON.stringify(fs.getState());

            await user.click(listOption("big"));

            expect(
                await screen.findByText(en.notes.openError["too-large"]),
            ).toBeInTheDocument();
            expect(screen.getByText(en.notes.openError.title)).toBeVisible();
            expect(screen.queryByRole("textbox")).toBeNull();
            expect(document.querySelector(".cm-editor")).toBeNull();
            expect(
                screen.getByRole("tab", { name: "big" }),
            ).toBeInTheDocument();
            expect(JSON.stringify(fs.getState())).toBe(before);
        });

        it("shows the not-UTF-8 message and writes nothing", async () => {
            const user = userEvent.setup();
            const { harness, fs } = await openApp({}, (seeded) => {
                seeded.externalWrite(
                    wsPath("bin.md"),
                    new Uint8Array([0xff, 0xfe, 0x41]),
                );
            });
            const before = JSON.stringify(fs.getState());

            await user.click(listOption("bin"));

            expect(
                await screen.findByText(en.notes.openError["not-utf8"]),
            ).toBeInTheDocument();
            expect(screen.queryByRole("textbox")).toBeNull();
            harness.scheduler.fire();
            await settle();
            expect(JSON.stringify(fs.getState())).toBe(before);
        });

        it("ignores typing actions on an unreadable note", async () => {
            const user = userEvent.setup();
            const { harness } = await openApp({}, (seeded) => {
                seeded.externalWrite(
                    wsPath("bin.md"),
                    new Uint8Array([0xff, 0xfe, 0x41]),
                );
            });
            await user.click(listOption("bin"));
            await screen.findByText(en.notes.openError["not-utf8"]);

            harness.notesActions.updateText(wsPath("bin.md"), "typed");

            const session = harness.notesStore.getState().openNotes[0];
            expect(session?.text).toBe("");
            expect(harness.scheduler.pending()).toBe(0);
            expect(
                screen.getByRole("tab", { name: "bin" }),
            ).toBeInTheDocument();
        });

        it("shows the symbolic link message", async () => {
            const { harness } = await openApp({}, (seeded) => {
                seeded.addSymlink(wsPath("link.md"));
            });

            await act(async () => {
                await harness.notesActions.openNote(wsPath("link.md"));
            });

            expect(
                await screen.findByText(en.notes.openError.symlink),
            ).toBeInTheDocument();
            expect(screen.queryByRole("textbox")).toBeNull();
        });

        it("can close the tab of an unreadable note", async () => {
            const user = userEvent.setup();
            const { harness } = await openApp({}, (seeded) => {
                seeded.addSymlink(wsPath("link.md"));
            });
            await act(async () => {
                await harness.notesActions.openNote(wsPath("link.md"));
            });
            await screen.findByText(en.notes.openError.symlink);

            await user.click(
                screen.getByRole("button", { name: "Close link" }),
            );

            await waitFor(() => {
                expect(tabs()).toHaveLength(0);
            });
            expect(
                screen.getByText(en.workspace.noNote.title),
            ).toBeInTheDocument();
        });
    });
});
