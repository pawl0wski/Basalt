import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import {
    createHarness,
    root,
    seedFs,
    settle,
    wsPath as wsPathOf,
} from "../test-harness";
import { AppContainer } from "./AppContainer";

const A = root("/home/me/Basalt notes");
const OPEN_FOLDER = { name: en.welcome.openFolder };

function renderApp(
    harness: ReturnType<typeof createHarness>,
    wrap: (node: React.ReactNode) => React.ReactNode = (node) => node,
) {
    return render(
        wrap(
            <ServicesProvider services={harness}>
                <AppContainer />
            </ServicesProvider>,
        ),
    );
}

function pressCtrl(key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", {
        key,
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
        ...init,
    });
    window.dispatchEvent(event);
    return event;
}

describe("AppContainer", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("restores the last workspace once on start, also under StrictMode", async () => {
        const harness = createHarness({
            workspaces: { [A]: seedFs({}) },
            settings: { version: 1, lastWorkspace: A, workspaces: {} },
        });
        const restore = vi.spyOn(harness.workspaceActions, "restoreWorkspace");

        renderApp(harness, (node) => <StrictMode>{node}</StrictMode>);

        expect(
            await screen.findByRole("navigation", {
                name: en.workspace.sidebarLabel,
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("Basalt notes")).toBeInTheDocument();
        expect(restore).toHaveBeenCalledTimes(1);
    });

    it("shows a neutral loading state, not the welcome screen, until restore finishes", async () => {
        const harness = createHarness({
            workspaces: { [A]: seedFs({}) },
            settings: { version: 1, lastWorkspace: A, workspaces: {} },
        });

        renderApp(harness);

        expect(screen.getByLabelText(en.welcome.restoring)).toBeInTheDocument();
        expect(
            screen.queryByRole("button", OPEN_FOLDER),
        ).not.toBeInTheDocument();
        await screen.findByRole("navigation", {
            name: en.workspace.sidebarLabel,
        });
    });

    it("lands on welcome without a notice when there is no last workspace", async () => {
        renderApp(createHarness());

        expect(
            await screen.findByRole("button", OPEN_FOLDER),
        ).toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("lands on welcome with the notice when the last workspace is gone", async () => {
        const harness = createHarness({
            settings: { version: 1, lastWorkspace: A, workspaces: {} },
        });

        renderApp(harness);

        expect(
            await screen.findByText(
                en.welcome.notices["workspace-missing"].message,
            ),
        ).toBeInTheDocument();
        expect(harness.persisted().lastWorkspace).toBe(A);
    });

    it("moves from welcome to the workspace layout when a folder is opened", async () => {
        const harness = createHarness({
            workspaces: { [root("/demo")]: seedFs({}) },
            picked: root("/demo"),
        });
        renderApp(harness);

        await userEvent.click(await screen.findByRole("button", OPEN_FOLDER));

        expect(
            await screen.findByRole("navigation", {
                name: en.workspace.sidebarLabel,
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("demo")).toBeInTheDocument();
    });

    it("opens the picker on Ctrl+O from welcome and prevents the browser default", async () => {
        const harness = createHarness({ picked: null });
        const open = vi.spyOn(harness.workspaceActions, "openWorkspace");
        renderApp(harness);
        await screen.findByRole("button", OPEN_FOLDER);

        const event = pressCtrl("o");

        expect(open).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    it("opens the picker on Cmd+O from a workspace window", async () => {
        const harness = createHarness({
            workspaces: { [A]: seedFs({}) },
            settings: { version: 1, lastWorkspace: A, workspaces: {} },
        });
        const open = vi.spyOn(harness.workspaceActions, "openWorkspace");
        renderApp(harness);
        await screen.findByRole("navigation", {
            name: en.workspace.sidebarLabel,
        });

        pressCtrl("o", { ctrlKey: false, metaKey: true });

        expect(open).toHaveBeenCalledTimes(1);
    });

    it("ignores other combinations and does not prevent their default", async () => {
        const harness = createHarness();
        const open = vi.spyOn(harness.workspaceActions, "openWorkspace");
        renderApp(harness);
        await screen.findByRole("button", OPEN_FOLDER);

        const events = [
            pressCtrl("o", { shiftKey: true }),
            pressCtrl("o", { ctrlKey: false }),
            pressCtrl("p"),
            pressCtrl("s"),
        ];
        await settle();

        expect(open).not.toHaveBeenCalled();
        for (const event of events) expect(event.defaultPrevented).toBe(false);
    });

    it("stops listening after unmount", async () => {
        const harness = createHarness();
        const open = vi.spyOn(harness.workspaceActions, "openWorkspace");
        const view = renderApp(harness);
        await screen.findByRole("button", OPEN_FOLDER);
        view.unmount();

        pressCtrl("o");

        await waitFor(() => expect(open).not.toHaveBeenCalled());
    });

    describe("workspace layout", () => {
        const files = {
            "Welcome.md": "",
            "ideas.md": "",
            "projects/Roadmap.md": "",
            "attachments/readme.txt": "",
        };

        async function openLayout(
            fsOptions: Parameters<typeof seedFs>[1] = {},
            extra: Partial<Parameters<typeof createHarness>[0]> = {},
        ) {
            const fs = seedFs(files, fsOptions);
            const harness = createHarness({
                workspaces: { [A]: fs },
                settings: { version: 1, lastWorkspace: A, workspaces: {} },
                ...extra,
            });
            renderApp(harness);
            await screen.findByRole("navigation", {
                name: en.workspace.sidebarLabel,
            });
            return { harness, fs };
        }

        it("shows the folder name, the folders first then the sorted Markdown notes, and the no-note empty state", async () => {
            const user = userEvent.setup();
            await openLayout();

            expect(screen.getByText("Basalt notes")).toBeInTheDocument();
            expect(
                screen
                    .getAllByRole("treeitem")
                    .map((option) => option.textContent),
            ).toEqual(["projects", "ideas", "Welcome"]);
            await user.click(
                screen.getByRole("treeitem", { name: "projects" }),
            );
            expect(
                screen
                    .getAllByRole("treeitem")
                    .map((option) => option.textContent),
            ).toEqual(["projects", "Roadmap", "ideas", "Welcome"]);
            expect(
                screen.getByText(en.workspace.noNote.title),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: /change workspace/i }),
            ).not.toBeInTheDocument();
        });

        it("opens a clicked note and highlights it in the list", async () => {
            const { harness } = await openLayout();

            await userEvent.click(
                screen.getByRole("treeitem", { name: "ideas" }),
            );

            expect(harness.notesStore.getState().activeNote).toBe("ideas.md");
            expect(
                screen.getByRole("treeitem", { name: "ideas" }),
            ).toHaveAttribute("aria-selected", "true");
        });

        it("offers to create the first note in an empty workspace", async () => {
            const harness = createHarness({
                workspaces: { [A]: seedFs({}) },
                settings: { version: 1, lastWorkspace: A, workspaces: {} },
            });
            renderApp(harness);

            await userEvent.click(
                await screen.findByRole("button", {
                    name: en.workspace.empty.action,
                }),
            );

            expect(
                await screen.findByRole("treeitem", { name: "Untitled" }),
            ).toBeInTheDocument();
        });

        it("creates notes with the New note button and with Ctrl+N", async () => {
            const { harness } = await openLayout();

            await userEvent.click(
                within(
                    screen.getByRole("navigation", {
                        name: en.workspace.sidebarLabel,
                    }),
                ).getByRole("button", { name: en.workspace.newNote }),
            );
            await screen.findByRole("treeitem", { name: "Untitled" });
            const event = pressCtrl("n");
            await screen.findByRole("treeitem", { name: "Untitled 1" });

            expect(event.defaultPrevented).toBe(true);
            expect(harness.notesStore.getState().activeNote).toBe(
                "Untitled 1.md",
            );
        });

        it("creates a note from the title bar New note button", async () => {
            const { harness } = await openLayout();

            await userEvent.click(
                within(
                    screen.getByRole("banner", { name: "Window title bar" }),
                ).getByRole("button", { name: en.workspace.newNote }),
            );

            await screen.findByRole("treeitem", { name: "Untitled" });
            expect(harness.notesStore.getState().activeNote).toBe(
                "Untitled.md",
            );
        });

        it("does not create a note on Ctrl+N from the welcome screen", async () => {
            const harness = createHarness();
            const create = vi.spyOn(harness.notesActions, "createNote");
            renderApp(harness);
            await screen.findByRole("button", OPEN_FOLDER);

            pressCtrl("n");
            await settle();

            expect(create).not.toHaveBeenCalled();
        });

        it("shows the read-only message and adds no entry when creating in a read-only workspace", async () => {
            await openLayout({ readOnly: true });

            await userEvent.click(
                within(
                    screen.getByRole("navigation", {
                        name: en.workspace.sidebarLabel,
                    }),
                ).getByRole("button", { name: en.workspace.newNote }),
            );

            expect(
                await screen.findByText(en.errors["permission-denied"]),
            ).toBeInTheDocument();
            expect(screen.getAllByRole("treeitem")).toHaveLength(3);
        });

        it("shows the fallback notice and refreshes on window focus when the watcher cannot start", async () => {
            const { fs } = await openLayout({ failWatch: true });
            expect(
                screen.getByText(en.workspace.watchFallback),
            ).toBeInTheDocument();

            fs.externalWrite(
                wsPathOf("added.md"),
                new TextEncoder().encode(""),
            );
            window.dispatchEvent(new Event("focus"));

            expect(
                await screen.findByRole("treeitem", { name: "added" }),
            ).toBeInTheDocument();
        });

        it("shows no fallback notice when the watcher is live", async () => {
            await openLayout();

            expect(
                screen.queryByText(en.workspace.watchFallback),
            ).not.toBeInTheDocument();
        });

        it("updates the list when the watcher reports a new note", async () => {
            const { harness, fs } = await openLayout();

            fs.externalWrite(
                wsPathOf("added.md"),
                new TextEncoder().encode(""),
            );
            harness.watchScheduler.fire();

            expect(
                await screen.findByRole("treeitem", { name: "added" }),
            ).toBeInTheDocument();
        });

        it("toggles the sidebar from the title bar", async () => {
            await openLayout();
            const toggle = screen.getByRole("button", {
                name: /toggle sidebar/i,
            });

            await userEvent.click(toggle);

            expect(toggle).toHaveAttribute("aria-expanded", "false");
            expect(
                document.querySelector(".app-sidebar-collapse"),
            ).toHaveAttribute("data-open", "false");
        });
    });
});
