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
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";

const A = root("/home/me/Notes");

const bytes = (text: string) => new TextEncoder().encode(text);

async function openApp(files: Record<string, string>) {
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

type App = Awaited<ReturnType<typeof openApp>>;

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
        screen.getByRole("listbox", { name: en.workspace.notesLabel }),
    ).getByRole("option", { name });
}

async function openNote(name: string) {
    await userEvent.setup().click(listOption(name));
    await screen.findByRole("textbox", { name });
}

async function deliver(app: App) {
    await act(async () => {
        app.harness.watchScheduler.fire();
        await settle();
    });
}

async function externalWrite(app: App, path: string, text: string) {
    app.fs.externalWrite(wsPath(path), bytes(text));
    await deliver(app);
}

async function externalDelete(app: App, path: string) {
    app.fs.externalDelete(wsPath(path));
    await deliver(app);
}

async function diskText(app: App, path: string) {
    const read = await app.fs.readText(wsPath(path));
    return read.ok ? read.value : null;
}

describe("external changes in the editor", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("reloads a clean note silently with no banner and no echo", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        const view = viewOf("a");
        view.dispatch({ selection: { anchor: 4 } });

        await externalWrite(app, "a.md", "ab");

        expect(view.state.doc.toString()).toBe("ab");
        expect(view.state.selection.main.head).toBe(2);
        expect(screen.queryByRole("alert")).toBeNull();
        expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
        expect(app.harness.scheduler.pending()).toBe(0);
        expect(app.harness.notesStore.getState().openNotes[0]).toMatchObject({
            text: "ab",
            baseText: "ab",
        });
    });

    it("does not let undo bring back the replaced text", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", "!");
        app.harness.scheduler.fire();
        await settle();

        await externalWrite(app, "a.md", "fresh");
        const view = viewOf("a");
        view.focus();
        await userEvent.setup().keyboard("{Control>}z{/Control}");

        expect(view.state.doc.toString()).toBe("fresh");
    });

    it("shows the conflict banner at once for a dirty note and keeps the text", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");

        await externalWrite(app, "a.md", "theirs");

        const banner = screen.getByRole("alert");
        expect(banner).toHaveTextContent(en.notes.conflict.title);
        expect(banner).toHaveTextContent(en.notes.conflict.message);
        expect(banner).toHaveAttribute("data-variant", "warning");
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(screen.getByText(en.saveStatus.notSaved)).toBeInTheDocument();
        expect(app.harness.scheduler.pending()).toBe(0);
    });

    it("keep my version writes our text and removes the banner", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalWrite(app, "a.md", "theirs");

        await userEvent.setup().click(
            screen.getByRole("button", {
                name: en.notes.conflict.keepMine,
            }),
        );

        await waitFor(() => {
            expect(screen.queryByRole("alert")).toBeNull();
        });
        expect(await diskText(app, "a.md")).toBe("base mine");
        expect(screen.getByText(en.saveStatus.saved)).toBeInTheDocument();
    });

    it("asks before loading the disk version: focus and Escape are on Cancel and the text is kept", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalWrite(app, "a.md", "theirs");

        await user.click(
            screen.getByRole("button", {
                name: en.notes.conflict.loadFromDisk,
            }),
        );

        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveTextContent("Load the version from disk?");
        expect(dialog).toHaveTextContent(
            'Your unsaved changes in "a" will be lost.',
        );
        expect(
            within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
        expect(
            within(dialog).getByRole("button", {
                name: "Load version from disk",
            }),
        ).toBeInTheDocument();

        await user.keyboard("{Escape}");

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(screen.getByRole("alert")).toHaveTextContent(
            en.notes.conflict.title,
        );
    });

    it("Cancel on the reload confirmation keeps the text", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalWrite(app, "a.md", "theirs");
        await user.click(
            screen.getByRole("button", {
                name: en.notes.conflict.loadFromDisk,
            }),
        );

        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Cancel",
            }),
        );

        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(await diskText(app, "a.md")).toBe("theirs");
    });

    it("confirming loads the disk text, discards local edits and removes the banner", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalWrite(app, "a.md", "theirs");
        await user.click(
            screen.getByRole("button", {
                name: en.notes.conflict.loadFromDisk,
            }),
        );

        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Load version from disk",
            }),
        );

        await waitFor(() => {
            expect(viewOf("a").state.doc.toString()).toBe("theirs");
        });
        expect(screen.queryByRole("alert")).toBeNull();
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await diskText(app, "a.md")).toBe("theirs");
        expect(screen.getByRole("tab", { name: "a" })).toBeInTheDocument();
    });

    it("shows the deleted banner and never recreates the file", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");

        await externalDelete(app, "a.md");
        app.harness.scheduler.fire();
        await settle();

        const banner = screen.getByRole("alert");
        expect(banner).toHaveTextContent(en.notes.deleted.title);
        expect(banner).toHaveTextContent(en.notes.deleted.message);
        expect(await diskText(app, "a.md")).toBeNull();
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
    });

    it("save again here recreates the file with the editor text", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalDelete(app, "a.md");

        await userEvent.setup().click(
            screen.getByRole("button", {
                name: en.notes.deleted.saveAgain,
            }),
        );

        await waitFor(() => {
            expect(screen.queryByRole("alert")).toBeNull();
        });
        expect(await diskText(app, "a.md")).toBe("base mine");
    });

    it("close note on a dirty deleted note asks first; Cancel keeps the tab and text", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalDelete(app, "a.md");

        await user.click(
            screen.getByRole("button", { name: en.notes.deleted.closeNote }),
        );

        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveTextContent("Close this note?");
        expect(dialog).toHaveTextContent(
            '"a" was deleted or moved. Your unsaved changes will be lost.',
        );
        expect(
            within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
        await user.keyboard("{Escape}");
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(screen.getAllByRole("tab", { hidden: true })).toHaveLength(1);
    });

    it("confirming close note closes the tab and discards the text", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        await externalDelete(app, "a.md");
        await user.click(
            screen.getByRole("button", { name: en.notes.deleted.closeNote }),
        );

        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Close note",
            }),
        );

        await waitFor(() => {
            expect(screen.queryAllByRole("tab")).toHaveLength(0);
        });
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await diskText(app, "a.md")).toBeNull();
    });

    it("close note on a clean deleted note closes without a confirmation", async () => {
        const user = userEvent.setup();
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        await externalDelete(app, "a.md");

        await user.click(
            screen.getByRole("button", { name: en.notes.deleted.closeNote }),
        );

        await waitFor(() => {
            expect(screen.queryAllByRole("tab")).toHaveLength(0);
        });
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("handles notes in tabs that are not active", async () => {
        const app = await openApp({ "a.md": "a base", "b.md": "b base" });
        await openNote("a");
        await openNote("b");
        typeInto("a", "!");

        app.fs.externalWrite(wsPath("a.md"), bytes("a theirs"));
        app.fs.externalWrite(wsPath("b.md"), bytes("b theirs"));
        await deliver(app);

        expect(viewOf("b").state.doc.toString()).toBe("b theirs");
        expect(viewOf("a").state.doc.toString()).toBe("a base!");
        const states = app.harness.notesStore.getState().openNotes;
        expect(states.find((s) => s.path === "a.md")?.error?.code).toBe(
            "conflict",
        );
        await userEvent.setup().click(screen.getByRole("tab", { name: /^a/ }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            en.notes.conflict.title,
        );
    });

    it("shows the conflict banner when a save finds the conflict the watcher missed", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        app.fs.externalWrite(wsPath("a.md"), bytes("theirs"));

        await act(async () => {
            app.harness.scheduler.fire();
            await settle();
        });

        expect(screen.getByRole("alert")).toHaveTextContent(
            en.notes.conflict.title,
        );
        expect(await diskText(app, "a.md")).toBe("theirs");
    });

    it("shows the deleted banner when a save finds the file gone", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        app.fs.externalDelete(wsPath("a.md"));

        await act(async () => {
            app.harness.scheduler.fire();
            await settle();
        });

        expect(screen.getByRole("alert")).toHaveTextContent(
            en.notes.deleted.title,
        );
        expect(await diskText(app, "a.md")).toBeNull();
    });

    it("keeps the generic save-error banner for other errors", async () => {
        const app = await openApp({ "a.md": "base" });
        await openNote("a");
        typeInto("a", " mine");
        app.fs.failNextWrite();

        await act(async () => {
            app.harness.scheduler.fire();
            await settle();
        });

        const banner = screen.getByRole("alert");
        expect(banner).toHaveTextContent(en.notes.saveError.title);
        expect(
            within(banner).getByRole("button", {
                name: en.notes.saveError.retry,
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: en.notes.conflict.keepMine }),
        ).toBeNull();
    });

    it("uses the exact confirmation wording from the spec", () => {
        expect(en.notes.confirmReload).toEqual({
            title: "Load the version from disk?",
            message: 'Your unsaved changes in "{name}" will be lost.',
            confirm: "Load version from disk",
            cancel: "Cancel",
        });
        expect(en.notes.confirmClose).toEqual({
            title: "Close this note?",
            message:
                '"{name}" was deleted or moved. Your unsaved changes will be lost.',
            confirm: "Close note",
            cancel: "Cancel",
        });
    });
});
