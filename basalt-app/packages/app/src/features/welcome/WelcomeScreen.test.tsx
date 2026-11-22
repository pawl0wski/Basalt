import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { ServicesProvider } from "../../ServicesProvider";
import { createHarness, root, seedFs, settle } from "../test-harness";
import { WelcomeScreen } from "./WelcomeScreen";
import { WelcomeScreenContainer } from "./WelcomeScreenContainer";

const A = root("/a");
const OPEN_FOLDER = { name: en.welcome.openFolder };

function renderContainer(harness: ReturnType<typeof createHarness>) {
    return render(
        <ServicesProvider services={harness}>
            <WelcomeScreenContainer />
        </ServicesProvider>,
    );
}

describe("WelcomeScreenContainer", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("renders every welcome text from the English resources", () => {
        renderContainer(createHarness());

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: en.welcome.headline,
            }),
        ).toBeInTheDocument();
        expect(screen.getByText(en.welcome.intro)).toBeInTheDocument();
        expect(screen.getByText(en.welcome.folderHint)).toBeInTheDocument();
        for (const { title, description } of Object.values(
            en.welcome.principles,
        )) {
            expect(
                screen.getByRole("heading", { level: 2, name: title }),
            ).toBeInTheDocument();
            expect(screen.getByText(description)).toBeInTheDocument();
        }
    });

    it("offers a single open-folder action and no alerts by default", () => {
        renderContainer(createHarness());

        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(screen.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("makes the welcome view its own keyboard-reachable scroller", () => {
        const { container } = renderContainer(createHarness());

        const root = container.firstElementChild;
        expect(root).toHaveClass("overflow-y-auto", "h-full");
        expect(root).toHaveAttribute("tabindex", "0");
    });

    it("opens the picked workspace through the store", async () => {
        const harness = createHarness({
            workspaces: { [A]: seedFs({ "n.md": "" }) },
            picked: A,
        });
        renderContainer(harness);

        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));

        await waitFor(() =>
            expect(harness.workspaceStore.getState()).toMatchObject({
                status: "open",
                root: A,
            }),
        );
    });

    it("shows nothing when the picker is cancelled", async () => {
        const harness = createHarness({ picked: null });
        renderContainer(harness);

        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));
        await settle();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(harness.workspaceStore.getState().status).toBe("welcome");
    });

    it("shows the translated error and stays on welcome when the folder cannot be opened", async () => {
        const harness = createHarness({
            picked: A,
            accessError: "unavailable",
        });
        renderContainer(harness);

        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(en.welcome.openError.title);
        expect(alert).toHaveTextContent(en.errors.unavailable);
        expect(screen.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        expect(harness.workspaceStore.getState().status).toBe("welcome");
    });

    it("shows the translated picker error", async () => {
        renderContainer(createHarness({ pickError: true }));

        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            en.errors.unknown,
        );
    });

    it("clears a previous error when a later open succeeds", async () => {
        const harness = createHarness({
            workspaces: { [A]: seedFs({}) },
            picked: root("/missing"),
        });
        renderContainer(harness);
        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));
        await screen.findByRole("alert");

        harness.pick(A);
        await userEvent.click(screen.getByRole("button", OPEN_FOLDER));

        await waitFor(() =>
            expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
        );
    });

    it.each([
        ["workspace-missing", undefined],
        ["workspace-unavailable", "unavailable"],
        ["workspace-access-needed", "scope-denied"],
    ] as const)(
        "explains a %s notice without an error and keeps lastWorkspace",
        async (notice, accessError) => {
            const harness = createHarness({
                settings: {
                    version: 1,
                    lastWorkspace: A,
                    workspaces: {},
                },
                accessError,
            });
            await harness.workspaceActions.restoreWorkspace();
            renderContainer(harness);

            const message = screen.getByRole("status");
            expect(message).toHaveTextContent(en.welcome.notices[notice].title);
            expect(message).toHaveTextContent(
                en.welcome.notices[notice].message,
            );
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            expect(harness.persisted().lastWorkspace).toBe(A);
            expect(screen.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        },
    );

    it("disables the action while the workspace is opening", () => {
        const harness = createHarness();
        harness.workspaceStore.setState({ status: "opening" });
        renderContainer(harness);

        expect(screen.getByRole("button", OPEN_FOLDER)).toBeDisabled();
    });
});

describe("WelcomeScreen", () => {
    it("shows the texts it is given without translating", async () => {
        const onOpenFolder = vi.fn();
        render(
            <WelcomeScreen
                texts={{
                    headline: "H",
                    intro: "I",
                    openFolder: "Open",
                    folderHint: "F",
                }}
                principles={[{ id: "markdown", title: "T", description: "D" }]}
                notice={{ title: "NT", message: "NM" }}
                error={{ title: "ET", message: "EM" }}
                onOpenFolder={onOpenFolder}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: "Open" }));

        expect(onOpenFolder).toHaveBeenCalledTimes(1);
        expect(
            screen.getByRole("heading", { level: 1, name: "H" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(1);
        expect(screen.getByRole("status")).toHaveTextContent("NM");
        expect(screen.getByRole("alert")).toHaveTextContent("EM");
    });

    it("does not call back while busy", async () => {
        const onOpenFolder = vi.fn();
        render(
            <WelcomeScreen
                texts={{
                    headline: "H",
                    intro: "I",
                    openFolder: "Open",
                    folderHint: "F",
                }}
                principles={[]}
                busy
                onOpenFolder={onOpenFolder}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: "Open" }));

        expect(onOpenFolder).not.toHaveBeenCalled();
    });
});
