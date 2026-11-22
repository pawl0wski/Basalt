import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView } from "@codemirror/view";
import { beforeAll, describe, expect, it } from "vitest";
import { defaultAppSettings } from "@basalt/core";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { AppContainer } from "../app/AppContainer";
import { createHarness, root, seedFs, settle } from "../test-harness";

const A = root("/home/me/Notes");

async function openApp(files: Record<string, string | Uint8Array>) {
    const fs = seedFs(files);
    const harness = createHarness({
        workspaces: { [A]: fs },
        settings: { ...defaultAppSettings(), lastWorkspace: A },
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

function listOption(name: string) {
    return within(
        screen.getByRole("tree", { name: en.workspace.notesLabel }),
    ).getByRole("treeitem", { name });
}

function pressCtrlS() {
    const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
    });
    window.dispatchEvent(event);
    return event;
}

async function disk(fs: ReturnType<typeof seedFs>, path: string) {
    const read = await fs.readText(path as never);
    return read.ok ? read.value : null;
}

function statusBar() {
    return document.querySelector(".bs-status-bar") as HTMLElement;
}

describe("save state and errors", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("shows nothing in the status bar until a note is open", async () => {
        await openApp({ "a.md": "x" });

        expect(statusBar().textContent).toBe("");
    });

    it("moves the tab between saved and not saved as the user types and autosave runs", async () => {
        const user = userEvent.setup();
        const { harness } = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
        expect(statusBar().textContent).toBe("1 word");

        typeInto("a", " more");
        await waitFor(() => {
            expect(
                screen.getByRole("tab", { name: "a not saved" }),
            ).toBeInTheDocument();
        });
        expect(statusBar().textContent).toBe("2 words");
        harness.scheduler.fire();
        await settle();

        await waitFor(() => {
            expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
        });
        expect(statusBar().textContent).toBe("2 words");
    });

    it("saves at once on Ctrl+S and prevents the browser dialog", async () => {
        const user = userEvent.setup();
        const { harness, fs } = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");

        let event!: KeyboardEvent;
        act(() => {
            event = pressCtrlS();
        });
        await settle();

        expect(event.defaultPrevented).toBe(true);
        expect(await disk(fs, "a.md")).toBe("base!");
        expect(harness.scheduler.pending()).toBe(0);
        await waitFor(() => {
            expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
        });
    });

    it("does nothing on Ctrl+S when no note is open", async () => {
        const { fs } = await openApp({ "a.md": "base" });
        const before = JSON.stringify(fs.getState());

        act(() => {
            pressCtrlS();
        });
        await settle();

        expect(JSON.stringify(fs.getState())).toBe(before);
    });

    it("shows a persistent alert with the reason, keeps the text and retries", async () => {
        const user = userEvent.setup();
        const { fs, harness } = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");
        fs.failNextWrite();

        harness.scheduler.fire();
        await settle();

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(en.notes.saveError.title);
        expect(alert).toHaveTextContent(en.errors.unknown);
        expect(
            screen.getByRole("tab", { name: "a not saved" }),
        ).toBeInTheDocument();
        expect(statusBar().textContent).toBe("1 word");
        expect(viewOf("a").state.doc.toString()).toBe("base!");

        await user.click(
            screen.getByRole("button", { name: en.notes.saveError.retry }),
        );
        await settle();

        await waitFor(() => {
            expect(screen.queryByRole("alert")).toBeNull();
        });
        expect(await disk(fs, "a.md")).toBe("base!");
        expect(viewOf("a").state.doc.toString()).toBe("base!");
        expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
    });
});

describe("leaving with a failing save", () => {
    beforeAll(async () => {
        await initI18n();
    });

    async function dirtyAndFailing() {
        const user = userEvent.setup();
        const opened = await openApp({ "a.md": "base" });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");
        opened.fs.failNextWrite();
        await user.click(screen.getByRole("button", { name: "Close a" }));
        const dialog = await screen.findByRole("alertdialog");
        return { user, dialog, ...opened };
    }

    it("opens the Save-failed dialog with focus on Cancel and the reason", async () => {
        const { dialog } = await dirtyAndFailing();

        expect(dialog).toHaveTextContent(
            en.saveFailed.title.replace("{name}", "a"),
        );
        expect(dialog).toHaveTextContent(en.errors.unknown);
        expect(
            within(dialog).getByRole("button", { name: en.saveFailed.cancel }),
        ).toHaveFocus();
    });

    it("Escape cancels: tab and text stay", async () => {
        const { user } = await dirtyAndFailing();

        await user.keyboard("{Escape}");

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(screen.getByRole("tab", { name: "a not saved" })).toBeVisible();
        expect(viewOf("a").state.doc.toString()).toBe("base!");
    });

    it("Discard closes the tab and drops the text", async () => {
        const { user, fs } = await dirtyAndFailing();

        await user.click(
            screen.getByRole("button", { name: en.saveFailed.discard }),
        );

        await waitFor(() => {
            expect(screen.queryAllByRole("tab")).toHaveLength(0);
        });
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await disk(fs, "a.md")).toBe("base");
    });

    it("Retry saves and closes the tab once the cause is gone", async () => {
        const { user, fs } = await dirtyAndFailing();

        await user.click(
            screen.getByRole("button", { name: en.saveFailed.retry }),
        );

        await waitFor(() => {
            expect(screen.queryAllByRole("tab")).toHaveLength(0);
        });
        expect(await disk(fs, "a.md")).toBe("base!");
    });

    it("opens the dialog when changing workspace and the flush fails", async () => {
        const user = userEvent.setup();
        const fsB = seedFs({ "b.md": "bee" });
        const fsA = seedFs({ "a.md": "base" });
        const harness = createHarness({
            workspaces: { [A]: fsA, [root("/b")]: fsB },
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
        fsA.failNextWrite();
        harness.pick(root("/b"));

        act(() => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "o",
                    ctrlKey: true,
                    cancelable: true,
                }),
            );
        });

        await screen.findByRole("alertdialog");
        expect(harness.workspaceStore.getState().root).toBe(A);

        await user.click(
            screen.getByRole("button", { name: en.saveFailed.retry }),
        );
        await waitFor(() => {
            expect(harness.workspaceStore.getState().root).toBe("/b");
        });
        expect(await disk(fsA, "a.md")).toBe("base!");
    });

    it("a close request flushes, and with a failure prevents the close and asks", async () => {
        const { harness, fs } = await openApp({ "a.md": "base" });
        const user = userEvent.setup();
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");
        fs.failNextWrite();

        let allowed = true;
        await act(async () => {
            allowed = await harness.requestWindowClose();
        });

        expect(allowed).toBe(false);
        const dialog = await screen.findByRole("alertdialog");
        expect(harness.windowState.destroyed).toBe(0);

        await user.click(
            within(dialog).getByRole("button", {
                name: en.saveFailed.discard,
            }),
        );
        await waitFor(() => {
            expect(harness.windowState.destroyed).toBe(1);
        });
        expect(await disk(fs, "a.md")).toBe("base");
    });

    it("a close request with saved notes is allowed without a dialog", async () => {
        const { harness } = await openApp({ "a.md": "base" });

        let allowed = false;
        await act(async () => {
            allowed = await harness.requestWindowClose();
        });

        expect(allowed).toBe(true);
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("the title bar Close button goes through the close guard", async () => {
        const { harness, fs } = await openApp({ "a.md": "base" });
        const user = userEvent.setup();
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        typeInto("a", "!");
        fs.failNextWrite();

        await user.click(screen.getByRole("button", { name: en.window.close }));

        await screen.findByRole("alertdialog");
        expect(harness.windowState.destroyed).toBe(0);
    });
});

describe("word count in the status bar", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("does not count a bare Markdown marker as a word", async () => {
        const user = userEvent.setup();
        await openApp({ "a.md": "# " });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });

        expect(statusBar().textContent).toBe("0 words");

        typeInto("a", "Title");
        await waitFor(() => {
            expect(statusBar().textContent).toBe("1 word");
        });
    });

    it("formats thousands and follows the active tab", async () => {
        const user = userEvent.setup();
        await openApp({
            "a.md": "word ".repeat(1204),
            "b.md": "one two three",
        });
        await user.click(listOption("a"));
        await screen.findByRole("textbox", { name: "a" });
        expect(statusBar().textContent).toBe("1,204 words");

        await user.click(listOption("b"));
        await screen.findByRole("textbox", { name: "b" });
        expect(statusBar().textContent).toBe("3 words");

        await user.click(screen.getByRole("tab", { name: "a" }));
        await waitFor(() => {
            expect(statusBar().textContent).toBe("1,204 words");
        });
    });

    it("shows no count for a note that failed to open", async () => {
        const user = userEvent.setup();
        await openApp({ "bin.md": new Uint8Array([0xff, 0xfe, 0x41]) });
        await user.click(listOption("bin"));
        await screen.findByText(en.notes.openError["not-utf8"]);

        expect(statusBar().textContent).toBe("");
    });
});
