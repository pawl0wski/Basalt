import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { defaultAppSettings } from "@basalt/core";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { AppContainer } from "../app/AppContainer";
import { createHarness, root, seedFs, settle } from "../test-harness";

const A = root("/home/me/Notes");
const B = root("/home/me/Other");
const texts = en.workspace.accessNeeded;

async function openApp() {
    const harness = createHarness({
        workspaces: {
            [A]: seedFs({ "a.md": "base" }),
            [B]: seedFs({ "z.md": "zed" }),
        },
        settings: { ...defaultAppSettings(), lastWorkspace: A },
    });
    render(
        <ServicesProvider services={harness}>
            <AppContainer />
        </ServicesProvider>,
    );
    await screen.findByRole("navigation", { name: en.workspace.sidebarLabel });
    await settle();
    await userEvent.setup().click(screen.getByRole("treeitem", { name: "a" }));
    await screen.findByRole("textbox", { name: "a" });
    return harness;
}

type Harness = Awaited<ReturnType<typeof openApp>>;

function setFlags(harness: Harness, flags: Record<string, boolean>) {
    harness.workspaceStore.setState(flags);
}

describe("workspace access banner", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("is absent while access is fine", async () => {
        await openApp();

        expect(screen.queryByText(texts.title)).toBeNull();
    });

    it("explains the problem and offers both actions once access is needed", async () => {
        const harness = await openApp();

        setFlags(harness, { accessNeeded: true });

        const banner = await screen.findByRole("alert");
        expect(banner).toHaveTextContent(texts.title);
        expect(banner).toHaveTextContent(texts.message);
        expect(
            within(banner).getByRole("button", { name: texts.grant }),
        ).toBeInTheDocument();
        expect(
            within(banner).getByRole("button", {
                name: texts.changeWorkspace,
            }),
        ).toBeInTheDocument();
    });

    it("Grant access re-picks the current folder, hides the banner and keeps the open note", async () => {
        const user = userEvent.setup();
        const harness = await openApp();
        setFlags(harness, { accessNeeded: true });
        harness.pick(A);

        await user.click(
            await screen.findByRole("button", { name: texts.grant }),
        );

        await waitFor(() => {
            expect(screen.queryByText(texts.title)).toBeNull();
        });
        expect(harness.pickCalls.at(-1)).toEqual({ defaultPath: A });
        expect(harness.workspaceStore.getState().accessNeeded).toBe(false);
        expect(screen.getByRole("textbox", { name: "a" })).toBeInTheDocument();
    });

    it("keeps the banner when the grant dialog is cancelled", async () => {
        const user = userEvent.setup();
        const harness = await openApp();
        setFlags(harness, { accessNeeded: true });
        harness.pick(null);

        await user.click(
            await screen.findByRole("button", { name: texts.grant }),
        );
        await settle();

        expect(screen.getByText(texts.title)).toBeInTheDocument();
        expect(harness.workspaceStore.getState().accessNeeded).toBe(true);
    });

    it("Change workspace opens the folder picker without a default path", async () => {
        const user = userEvent.setup();
        const harness = await openApp();
        setFlags(harness, { accessNeeded: true });
        harness.pick(null);
        const before = harness.pickCalls.length;

        await user.click(
            await screen.findByRole("button", { name: texts.changeWorkspace }),
        );

        await waitFor(() => {
            expect(harness.pickCalls.length).toBe(before + 1);
        });
        expect(harness.pickCalls.at(-1)?.defaultPath).toBeUndefined();
    });

    it("shows only the unavailable banner when the folder is gone as well", async () => {
        const harness = await openApp();

        setFlags(harness, { accessNeeded: true, unavailable: true });

        expect(
            await screen.findByText(en.workspace.unavailable.title),
        ).toBeInTheDocument();
        expect(screen.queryByText(texts.title)).toBeNull();
        expect(screen.queryByRole("button", { name: texts.grant })).toBeNull();
    });
});
