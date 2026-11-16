import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineError } from "./InlineError";

describe("InlineError", () => {
    it("is announced as an alert with its message", () => {
        render(<InlineError>The workspace is read-only.</InlineError>);

        expect(screen.getByRole("alert").textContent).toBe(
            "The workspace is read-only.",
        );
    });

    it("keeps the decorative icon out of the accessibility tree", () => {
        render(<InlineError>Failed</InlineError>);

        expect(
            screen
                .getByRole("alert")
                .querySelector("svg")
                ?.getAttribute("aria-hidden"),
        ).toBe("true");
    });

    it("merges a custom class without dropping the danger colour", () => {
        render(<InlineError className="mt-in-group">Failed</InlineError>);

        const className = screen.getByRole("alert").className;
        expect(className).toContain("mt-in-group");
        expect(className).toContain("text-status-danger");
    });
});
