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
const B = root("/home/me/Other");

async function openApp(files: Record<string, string> = { "a.md": "base" }) {
    const fs = seedFs(files);
    const other = seedFs({ "z.md": "zed" });
    const harness = createHarness({
        workspaces: { [A]: fs, [B]: other },
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

async function openNote(name: string) {
    await userEvent
        .setup()
        .click(
            within(
                screen.getByRole("listbox", { name: en.workspace.notesLabel }),
            ).getByRole("option", { name }),
        );
    await screen.findByRole("textbox", { name });
}

async function loseRoot(app: App) {
    await act(async () => {
        app.fs.removeRoot();
        await settle();
    });
}

const notice = en.welcome.notices["workspace-unavailable"];

describe("workspace lost", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("returns to Welcome with the notice and keeps lastWorkspace when nothing is unsaved", async () => {
        const app = await openApp();
        await openNote("a");

        await loseRoot(app);

        expect(await screen.findByText(notice.title)).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: en.welcome.openFolder }),
        ).toBeInTheDocument();
        expect(app.harness.workspaceStore.getState()).toMatchObject({
            status: "welcome",
            root: null,
            notice: "workspace-unavailable",
        });
        expect(app.harness.persisted().lastWorkspace).toBe(A);
    });

    it("keeps the editor and text, shows the Save-failed dialog first, then the banner", async () => {
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");

        await loseRoot(app);

        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveTextContent('Could not save "a"');
        expect(dialog).toHaveTextContent(en.errors.unavailable);
        expect(
            within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();

        await userEvent
            .setup()
            .click(within(dialog).getByRole("button", { name: "Cancel" }));

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        const banner = screen.getByRole("alert");
        expect(banner).toHaveTextContent(en.workspace.unavailable.title);
        expect(banner).toHaveTextContent(en.workspace.unavailable.message);
        expect(banner).toHaveAttribute("data-variant", "danger");
        expect(
            within(banner).getByRole("button", {
                name: en.workspace.unavailable.retry,
            }),
        ).toBeInTheDocument();
        expect(
            within(banner).getByRole("button", {
                name: en.workspace.unavailable.changeWorkspace,
            }),
        ).toBeInTheDocument();
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(app.harness.workspaceStore.getState().status).toBe("open");
        expect(screen.getByText(en.saveStatus.notSaved)).toBeInTheDocument();
    });

    it("Retry while the folder is still gone reports it in the Save-failed dialog", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        await loseRoot(app);
        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Cancel",
            }),
        );
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });

        await user.click(
            screen.getByRole("button", {
                name: en.workspace.unavailable.retry,
            }),
        );

        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).toHaveTextContent(en.errors.unavailable);
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
    });

    it("Discard in the Save-failed dialog leaves for Welcome with the notice", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        await loseRoot(app);

        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Discard changes",
            }),
        );

        expect(await screen.findByText(notice.title)).toBeInTheDocument();
        expect(app.harness.workspaceStore.getState().status).toBe("welcome");
        expect(app.harness.persisted().lastWorkspace).toBe(A);
    });

    it("recovers when Retry can save again", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        app.fs.failNextWrite();
        await act(async () => {
            await app.harness.workspaceActions.handleWorkspaceLost();
        });
        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Cancel",
            }),
        );
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(screen.getByRole("alert")).toHaveTextContent(
            en.workspace.unavailable.title,
        );

        await user.click(
            screen.getByRole("button", {
                name: en.workspace.unavailable.retry,
            }),
        );

        await waitFor(() => {
            expect(screen.queryByRole("alert")).toBeNull();
        });
        expect(app.harness.workspaceStore.getState().unavailable).toBe(false);
        const saved = await app.fs.readText("a.md" as never);
        expect(saved.ok && saved.value).toBe("base mine");
        expect(screen.getByText(en.saveStatus.saved)).toBeInTheDocument();
    });

    it("Change workspace opens the picker and, after Discard, the other workspace", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        await loseRoot(app);
        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Cancel",
            }),
        );
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        app.harness.pick(B);

        await user.click(
            screen.getByRole("button", {
                name: en.workspace.unavailable.changeWorkspace,
            }),
        );
        const dialog = await screen.findByRole("alertdialog");
        await user.click(
            within(dialog).getByRole("button", { name: "Discard changes" }),
        );

        await waitFor(() => {
            expect(app.harness.workspaceStore.getState().root).toBe(B);
        });
        expect(app.harness.workspaceStore.getState().unavailable).toBe(false);
        expect(await screen.findByRole("option", { name: "z" })).toBeVisible();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("keeps the Save-failed dialog usable when the folder is lost while it is open", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        app.fs.failNextWrite();
        await user.click(screen.getByRole("button", { name: "Close a" }));
        const dialog = await screen.findByRole("alertdialog");
        expect(dialog).not.toHaveTextContent(en.errors.unavailable);

        await loseRoot(app);

        expect(screen.getByRole("alertdialog")).toBe(dialog);
        await user.click(within(dialog).getByRole("button", { name: "Retry" }));
        await waitFor(() => {
            expect(screen.getByRole("alertdialog")).toHaveTextContent(
                en.errors.unavailable,
            );
        });
        expect(screen.getAllByRole("alertdialog")).toHaveLength(1);

        await user.click(
            within(dialog).getByRole("button", { name: "Cancel" }),
        );

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(viewOf("a").state.doc.toString()).toBe("base mine");
        expect(screen.getByRole("alert")).toHaveTextContent(
            en.workspace.unavailable.title,
        );
    });

    it("does not open a second dialog or banner for repeated root-lost events", async () => {
        const user = userEvent.setup();
        const app = await openApp();
        await openNote("a");
        typeInto("a", " mine");
        await loseRoot(app);
        await user.click(
            within(await screen.findByRole("alertdialog")).getByRole("button", {
                name: "Cancel",
            }),
        );
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });

        await act(async () => {
            await app.harness.workspaceActions.handleWorkspaceLost();
        });

        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(screen.getAllByRole("alert")).toHaveLength(1);
    });
});
