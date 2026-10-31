import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaveStatus } from "./SaveStatus";
import { StatusBar } from "./StatusBar";

describe("SaveStatus", () => {
    it.each([
        ["saved", "Saved"],
        ["saving", "Saving…"],
        ["unsaved", "Not saved"],
    ] as const)("says %s in words", (state, text) => {
        render(<SaveStatus state={state} />);

        expect(screen.getByRole("status").textContent).toBe(text);
    });

    it("uses the warning color only when the note is not saved", () => {
        const { rerender } = render(<SaveStatus state="unsaved" />);
        expect(screen.getByRole("status").className).toContain(
            "text-status-warning",
        );

        rerender(<SaveStatus state="saved" />);
        expect(screen.getByRole("status").className).not.toContain(
            "text-status-",
        );
    });

    it("takes translated texts through props", () => {
        render(<SaveStatus state="saved" messages={{ saved: "Zapisano" }} />);

        expect(screen.getByRole("status").textContent).toBe("Zapisano");
    });
});

describe("StatusBar", () => {
    it("shows counts with thousands separators and the save status", () => {
        render(
            <StatusBar
                wordCount={1204}
                characterCount={7311}
                saveState="saving"
            />,
        );

        expect(screen.getByText("1,204 words · 7,311 characters")).toBeTruthy();
        expect(screen.getByRole("status").textContent).toBe("Saving…");
    });

    it("omits what it is not given", () => {
        render(<StatusBar wordCount={3} />);

        expect(screen.getByText("3 words")).toBeTruthy();
        expect(screen.queryByRole("status")).toBeNull();
    });
});
