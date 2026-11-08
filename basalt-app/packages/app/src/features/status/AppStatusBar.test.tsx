import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppStatusBar } from "./AppStatusBar";

const labels = {
    saved: "Saved",
    saving: "Saving…",
    unsaved: "Not saved",
};

describe("AppStatusBar", () => {
    it.each([
        ["saved", "Saved"],
        ["saving", "Saving…"],
        ["unsaved", "Not saved"],
    ] as const)("shows %s as %s", (saveState, text) => {
        render(<AppStatusBar saveState={saveState} labels={labels} />);

        expect(screen.getByRole("status")).toHaveTextContent(text);
    });

    it("shows only the save state: no counts and no sync wording", () => {
        const { container } = render(
            <AppStatusBar saveState="saved" labels={labels} />,
        );

        expect(container.textContent).toBe("Saved");
    });

    it("shows nothing when no note is active", () => {
        const { container } = render(
            <AppStatusBar saveState={null} labels={labels} />,
        );

        expect(screen.queryByRole("status")).toBeNull();
        expect(container.textContent).toBe("");
    });
});
