import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
    it("is hidden from assistive technology", () => {
        const { container } = render(<Skeleton />);

        expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    });

    it("lets the caller size it", () => {
        const { container } = render(<Skeleton className="h-tree-row" />);

        const className = container.firstElementChild?.className ?? "";
        expect(className).toContain("h-tree-row");
        expect(className).not.toContain("h-icon ");
    });
});
