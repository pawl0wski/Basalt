import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusIndicator } from "./StatusIndicator";

describe("StatusIndicator", () => {
    it.each([
        ["synced", "Synced"],
        ["syncing", "Syncing"],
        ["conflict", "Sync conflict"],
        ["error", "Sync error"],
    ] as const)("says %s in words", (status, text) => {
        render(<StatusIndicator status={status} />);

        expect(screen.getByRole("status").textContent).toBe(text);
    });

    it("uses the danger color only for errors and the warning color only for conflicts", () => {
        const { rerender } = render(<StatusIndicator status="error" />);
        expect(screen.getByRole("status").className).toContain(
            "text-status-danger",
        );

        rerender(<StatusIndicator status="conflict" />);
        expect(screen.getByRole("status").className).toContain(
            "text-status-warning",
        );

        rerender(<StatusIndicator status="synced" />);
        const className = screen.getByRole("status").className;
        expect(className).not.toContain("text-status-");
    });

    it("hides the icon from assistive technology", () => {
        render(<StatusIndicator status="synced" />);

        expect(
            screen
                .getByRole("status")
                .querySelector("svg")
                ?.getAttribute("aria-hidden"),
        ).toBe("true");
    });
});
