import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
    it("announces errors immediately", () => {
        render(<Alert variant="danger">Could not save the note.</Alert>);

        expect(screen.getByRole("alert").textContent).toContain(
            "Could not save the note.",
        );
    });

    it("announces information and warnings politely", () => {
        render(
            <>
                <Alert>Notes are stored in your folder.</Alert>
                <Alert variant="warning">Sync is paused.</Alert>
            </>,
        );

        expect(screen.getAllByRole("status")).toHaveLength(2);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("renders the title and the action", () => {
        render(
            <Alert
                variant="warning"
                title="Sync conflict"
                action={<button type="button">Review</button>}
            >
                Two devices changed this note.
            </Alert>,
        );

        expect(screen.getByText("Sync conflict")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Review" })).toBeTruthy();
    });
});

describe("Alert role override", () => {
    it("announces a warning banner immediately when role is alert", () => {
        render(
            <Alert variant="warning" role="alert" title="Note changed on disk">
                Saving is paused.
            </Alert>,
        );

        expect(
            screen
                .getByRole("alert", { name: "" })
                .getAttribute("data-variant"),
        ).toBe("warning");
        expect(screen.queryByRole("status")).toBeNull();
    });
});
