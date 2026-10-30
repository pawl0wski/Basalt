import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

describe("EmptyState", () => {
    it("names the state, explains why and offers the next step", () => {
        render(
            <EmptyState
                title="No notes yet"
                description="Notes you create are saved as Markdown files in your folder."
                action={<button type="button">New note</button>}
            />,
        );

        expect(screen.getByRole("heading", { level: 2, name: "No notes yet" })).toBeTruthy();
        expect(screen.getByText(/saved as Markdown files/)).toBeTruthy();
        expect(screen.getByRole("button", { name: "New note" })).toBeTruthy();
    });

    it("uses the requested heading level", () => {
        render(<EmptyState title="No results" headingAs="h3" />);

        expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
    });
});

describe("ErrorState", () => {
    it("announces the failure and offers a retry", () => {
        render(
            <ErrorState
                title="Could not open the workspace"
                description="The folder is not available."
                action={<button type="button">Try again</button>}
            />,
        );

        expect(screen.getByRole("alert").textContent).toContain("Could not open the workspace");
        expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });

    it("shows technical details only when given", () => {
        const { rerender } = render(<ErrorState title="Failed" description="Try again later." />);
        expect(screen.queryByText("EACCES: permission denied")).toBeNull();

        rerender(<ErrorState title="Failed" description="Try again later." details="EACCES: permission denied" />);
        expect(screen.getByText("EACCES: permission denied")).toBeTruthy();
    });
});
