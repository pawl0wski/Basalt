import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppStatusBar } from "./AppStatusBar";

const format = (count: number) => `${count} words`;

describe("AppStatusBar", () => {
    it("shows the formatted word count", () => {
        render(<AppStatusBar wordCount={1204} formatWordCount={format} />);

        expect(screen.getByText("1204 words")).toBeInTheDocument();
    });

    it("shows a zero count", () => {
        render(<AppStatusBar wordCount={0} formatWordCount={format} />);

        expect(screen.getByText("0 words")).toBeInTheDocument();
    });

    it("renders an empty bar without a count or a save state when there is no count", () => {
        const { container } = render(
            <AppStatusBar wordCount={null} formatWordCount={format} />,
        );

        expect(container.textContent).toBe("");
        expect(container.querySelector(".bs-status-bar")).not.toBeNull();
        expect(screen.queryByRole("status")).toBeNull();
    });

    it("never renders save-state wording", () => {
        const { container } = render(
            <AppStatusBar wordCount={3} formatWordCount={format} />,
        );

        expect(container.textContent).not.toMatch(/saved|saving/i);
        expect(screen.queryByRole("status")).toBeNull();
    });
});
