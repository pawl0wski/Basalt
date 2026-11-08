import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TitleBarProps } from "./TitleBar";
import { TitleBar } from "./TitleBar";

const tabs = [
    { id: "a", name: "Weekly plan" },
    { id: "b", name: "Sync server spec", unsaved: true },
    { id: "c", name: "Roadmap" },
];

const baseProps = (): TitleBarProps => ({
    tabs,
    activeTabId: "a",
    onSelectTab: vi.fn(),
    onCloseTab: vi.fn(),
    onNewNote: vi.fn(),
    onToggleSidebar: vi.fn(),
    onToggleSidePanel: vi.fn(),
});

describe("TitleBar", () => {
    it("lists the open notes and marks the open one", () => {
        render(<TitleBar {...baseProps()} />);

        const list = screen.getByRole("list", { name: "Open notes" });
        expect(within(list).getAllByRole("listitem")).toHaveLength(3);
        expect(
            screen.getByRole("button", { name: "Weekly plan" }).ariaCurrent,
        ).toBe("true");
        expect(
            screen.getByRole("button", { name: "Roadmap" }).ariaCurrent,
        ).toBeNull();
    });

    it("selects a note from its tab and closes it from its own button", async () => {
        const user = userEvent.setup();
        const props = baseProps();

        render(<TitleBar {...props} />);
        await user.click(screen.getByRole("button", { name: "Roadmap" }));
        await user.click(
            screen.getByRole("button", { name: "Close Weekly plan" }),
        );

        expect(props.onSelectTab).toHaveBeenCalledExactlyOnceWith("c");
        expect(props.onCloseTab).toHaveBeenCalledExactlyOnceWith("a");
        expect(props.onSelectTab).not.toHaveBeenCalledWith("a");
    });

    it("says that a tab is not saved and still lets the user close it", async () => {
        const user = userEvent.setup();
        const props = baseProps();

        render(<TitleBar {...props} />);

        expect(
            screen.getByRole("button", { name: "Sync server spec not saved" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Weekly plan not saved" }),
        ).toBeNull();
        await user.click(
            screen.getByRole("button", { name: "Close Sync server spec" }),
        );
        expect(props.onCloseTab).toHaveBeenCalledExactlyOnceWith("b");
    });

    it("shows no tab list when no note is open but keeps the toggles", () => {
        render(<TitleBar {...baseProps()} tabs={[]} activeTabId={undefined} />);

        expect(screen.queryByRole("list")).toBeNull();
        expect(
            screen.getByRole("button", { name: "Toggle sidebar" }),
        ).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Toggle right panel" }),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "New note" })).toBeTruthy();
    });

    it("reports the panel state on the toggles", async () => {
        const user = userEvent.setup();
        const props = baseProps();

        render(<TitleBar {...props} sidebarOpen sidePanelOpen={false} />);
        const sidebar = screen.getByRole("button", { name: "Toggle sidebar" });
        const panel = screen.getByRole("button", {
            name: "Toggle right panel",
        });

        expect(sidebar.getAttribute("aria-expanded")).toBe("true");
        expect(panel.getAttribute("aria-expanded")).toBe("false");
        await user.click(panel);
        expect(props.onToggleSidePanel).toHaveBeenCalledOnce();
        expect(props.onToggleSidebar).not.toHaveBeenCalled();
    });

    it("draws the window buttons only when it is given their actions", async () => {
        const user = userEvent.setup();
        const windowControls = {
            onMinimize: vi.fn(),
            onToggleMaximize: vi.fn(),
            onClose: vi.fn(),
        };

        const { rerender } = render(<TitleBar {...baseProps()} />);
        expect(
            screen.queryByRole("button", { name: "Close window" }),
        ).toBeNull();

        rerender(<TitleBar {...baseProps()} windowControls={windowControls} />);
        await user.click(
            screen.getByRole("button", { name: "Minimize window" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Maximize window" }),
        );
        await user.click(screen.getByRole("button", { name: "Close window" }));

        expect(windowControls.onMinimize).toHaveBeenCalledOnce();
        expect(windowControls.onToggleMaximize).toHaveBeenCalledOnce();
        expect(windowControls.onClose).toHaveBeenCalledOnce();
    });
});

describe("TitleBar window chrome", () => {
    const windowControls = () => ({
        onMinimize: vi.fn(),
        onToggleMaximize: vi.fn(),
        onClose: vi.fn(),
    });

    it("shows a title and only the controls it is given handlers for", () => {
        render(<TitleBar title="Basalt" windowControls={windowControls()} />);

        expect(screen.getByText("Basalt")).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Toggle sidebar" }),
        ).toBeNull();
        expect(screen.queryByRole("button", { name: "New note" })).toBeNull();
        expect(
            screen.queryByRole("button", { name: "Toggle right panel" }),
        ).toBeNull();
        expect(screen.getAllByRole("button")).toHaveLength(3);
    });

    it("offers restore instead of maximize while the window is maximized", () => {
        const { rerender } = render(
            <TitleBar windowControls={windowControls()} />,
        );
        expect(
            screen.getByRole("button", { name: "Maximize window" }),
        ).toBeTruthy();

        rerender(
            <TitleBar
                windowControls={{ ...windowControls(), maximized: true }}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Restore window" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Maximize window" }),
        ).toBeNull();
    });

    it("uses the labels it is given for the window buttons", () => {
        render(
            <TitleBar
                windowControls={{
                    ...windowControls(),
                    labels: {
                        minimize: "Minimise",
                        maximize: "Enlarge",
                        restore: "Shrink",
                        close: "Quit",
                    },
                }}
            />,
        );

        expect(
            screen
                .getAllByRole("button")
                .map((b) => b.getAttribute("aria-label")),
        ).toEqual(["Minimise", "Enlarge", "Quit"]);
    });

    it("marks the bar and the empty space as drag regions but not the buttons", () => {
        render(<TitleBar title="Basalt" windowControls={windowControls()} />);

        expect(
            screen.getByRole("banner").hasAttribute("data-tauri-drag-region"),
        ).toBe(true);
        expect(
            screen.getByText("Basalt").hasAttribute("data-tauri-drag-region"),
        ).toBe(true);
        expect(
            screen
                .getByRole("button", { name: "Close window" })
                .hasAttribute("data-tauri-drag-region"),
        ).toBe(false);
    });
});

describe("TitleBar overflow", () => {
    afterEach(() => {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollWidth");
    });

    it("has no open-notes menu while the tabs fit", () => {
        render(<TitleBar {...baseProps()} />);

        expect(
            screen.queryByRole("button", { name: "Show all open notes" }),
        ).toBeNull();
    });

    it("lists every open note in a menu when the tabs do not fit", async () => {
        Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
            configurable: true,
            get: () => 500,
        });
        const user = userEvent.setup();
        const props = baseProps();

        render(<TitleBar {...props} />);
        await user.click(
            screen.getByRole("button", { name: "Show all open notes" }),
        );

        expect(
            screen.getAllByRole("menuitem").map((item) => item.textContent),
        ).toEqual(["Weekly plan", "Sync server spec", "Roadmap"]);
        await user.click(screen.getByRole("menuitem", { name: "Roadmap" }));
        expect(props.onSelectTab).toHaveBeenCalledExactlyOnceWith("c");
    });
});
