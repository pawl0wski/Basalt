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
});
