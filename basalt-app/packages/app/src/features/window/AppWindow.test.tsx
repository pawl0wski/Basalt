import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppWindow, type AppWindowProps } from "./AppWindow";

const labels = {
    minimize: "Minimise it",
    maximize: "Enlarge it",
    restore: "Shrink it",
    close: "Quit it",
};

function props(overrides: Partial<AppWindowProps> = {}): AppWindowProps {
    return {
        title: "Basalt",
        labels,
        maximized: false,
        onMinimize: vi.fn(),
        onToggleMaximize: vi.fn(),
        onClose: vi.fn(),
        children: <p>content</p>,
        ...overrides,
    };
}

describe("AppWindow", () => {
    it("shows the title and content", () => {
        render(<AppWindow {...props()} />);

        expect(screen.getByText("Basalt")).toBeInTheDocument();
        expect(screen.getByText("content")).toBeInTheDocument();
    });

    it("hides the title while tabs are open so they sit on the left", () => {
        render(
            <AppWindow
                {...props({
                    workspace: {
                        tabs: {
                            tabs: [{ id: "a.md", name: "a" }],
                            activeTabId: "a.md",
                            onSelectTab: vi.fn(),
                            onCloseTab: vi.fn(),
                        },
                        sidebarOpen: true,
                        onToggleSidebar: vi.fn(),
                        activityBar: null,
                        sidebar: null,
                        statusBar: null,
                    },
                })}
            />,
        );

        expect(screen.getByRole("tab", { name: /a/ })).toBeInTheDocument();
        expect(screen.queryByText("Basalt")).not.toBeInTheDocument();
    });

    it("emits each window callback from its own named button", async () => {
        const user = userEvent.setup();
        const p = props();
        render(<AppWindow {...p} />);

        await user.click(screen.getByRole("button", { name: labels.minimize }));
        await user.click(screen.getByRole("button", { name: labels.maximize }));
        await user.click(screen.getByRole("button", { name: labels.close }));

        expect(p.onMinimize).toHaveBeenCalledOnce();
        expect(p.onToggleMaximize).toHaveBeenCalledOnce();
        expect(p.onClose).toHaveBeenCalledOnce();
    });

    it("names the maximize button restore while maximized", () => {
        render(<AppWindow {...props({ maximized: true })} />);

        expect(
            screen.getByRole("button", { name: labels.restore }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: labels.maximize }),
        ).not.toBeInTheDocument();
    });

    it("shows no sidebar toggle outside a workspace", () => {
        render(<AppWindow {...props()} />);

        expect(
            screen.queryByRole("button", { name: /toggle sidebar/i }),
        ).not.toBeInTheDocument();
    });

    it("renders the workspace regions and reports the sidebar toggle with its state", async () => {
        const user = userEvent.setup();
        const onToggleSidebar = vi.fn();
        const workspace = {
            sidebarOpen: true,
            onToggleSidebar,
            activityBar: <p>activity</p>,
            sidebar: <p>sidebar</p>,
            statusBar: <p>status</p>,
        };
        const { rerender } = render(<AppWindow {...props({ workspace })} />);

        for (const text of ["activity", "sidebar", "status"]) {
            expect(screen.getByText(text)).toBeInTheDocument();
        }
        const toggle = screen.getByRole("button", { name: /toggle sidebar/i });
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        await user.click(toggle);
        expect(onToggleSidebar).toHaveBeenCalledOnce();

        rerender(
            <AppWindow
                {...props({ workspace: { ...workspace, sidebarOpen: false } })}
            />,
        );
        expect(
            screen.getByRole("button", { name: /toggle sidebar/i }),
        ).toHaveAttribute("aria-expanded", "false");
        expect(screen.getByText("sidebar").closest("[inert]")).not.toBeNull();
    });
});
