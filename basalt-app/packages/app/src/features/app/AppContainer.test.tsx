import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { createHarness, root, seedFs, settle } from "../test-harness";
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
            await screen.findByRole("heading", {
                name: en.workspace.openTitle,
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
        await screen.findByRole("heading", { name: en.workspace.openTitle });
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

    it("moves from welcome to the workspace placeholder when a folder is opened", async () => {
        const harness = createHarness({
            workspaces: { [root("/demo")]: seedFs({}) },
            picked: root("/demo"),
        });
        renderApp(harness);

        await userEvent.click(await screen.findByRole("button", OPEN_FOLDER));

        expect(
            await screen.findByRole("heading", {
                name: en.workspace.openTitle,
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
        await screen.findByRole("heading", { name: en.workspace.openTitle });

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
});
