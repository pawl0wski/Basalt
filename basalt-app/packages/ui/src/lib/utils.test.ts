import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
    it("keeps a Basalt font size next to a Basalt text color", () => {
        expect(cn("text-size-ui", "text-text-on-accent")).toBe(
            "text-size-ui text-text-on-accent",
        );
    });

    it("lets a later text color replace an earlier one", () => {
        expect(cn("text-text-ui", "text-status-danger")).toBe(
            "text-status-danger",
        );
    });

    it("lets a later font size replace an earlier one", () => {
        expect(cn("text-size-ui", "text-size-ui-small")).toBe(
            "text-size-ui-small",
        );
    });

    it("lets a later height replace an earlier one", () => {
        expect(cn("h-icon-button", "h-activity-button")).toBe(
            "h-activity-button",
        );
    });

    it("lets a later width token replace an earlier one, including the newer tokens", () => {
        expect(cn("w-sidebar", "w-overlay")).toBe("w-overlay");
        expect(cn("max-w-note-tab-max", "max-w-overlay")).toBe("max-w-overlay");
        expect(cn("min-w-note-tab-min", "min-w-overlay")).toBe("min-w-overlay");
    });

    it("lets a later radius replace an earlier one", () => {
        expect(cn("rounded-control", "rounded-container")).toBe(
            "rounded-container",
        );
    });

    it("keeps unrelated spacing utilities", () => {
        expect(cn("px-between-groups", "gap-in-group")).toBe(
            "px-between-groups gap-in-group",
        );
    });
});
