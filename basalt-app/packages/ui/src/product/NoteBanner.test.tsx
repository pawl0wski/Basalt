import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoteBanner } from "./NoteBanner";

describe("NoteBanner", () => {
    it("offers both ways out of a conflict and reports the chosen one", async () => {
        const user = userEvent.setup();
        const onKeepMine = vi.fn();
        const onLoadFromDisk = vi.fn();

        render(<NoteBanner kind="conflict" onKeepMine={onKeepMine} onLoadFromDisk={onLoadFromDisk} />);
        await user.click(screen.getByRole("button", { name: "Load version from disk" }));

        expect(onLoadFromDisk).toHaveBeenCalledOnce();
        expect(onKeepMine).not.toHaveBeenCalled();
        expect(screen.getByRole("status").textContent).toContain("This note changed on disk");
    });

    it("lets the owner save a deleted note again or close it", async () => {
        const user = userEvent.setup();
        const onSaveAgain = vi.fn();
        const onCloseNote = vi.fn();

        render(<NoteBanner kind="deleted" onSaveAgain={onSaveAgain} onCloseNote={onCloseNote} />);
        await user.click(screen.getByRole("button", { name: "Save again here" }));
        await user.click(screen.getByRole("button", { name: "Close note" }));

        expect(onSaveAgain).toHaveBeenCalledOnce();
        expect(onCloseNote).toHaveBeenCalledOnce();
    });

    it("announces a save failure as an alert with a retry", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();

        render(<NoteBanner kind="permission-denied" onRetry={onRetry} />);
        await user.click(screen.getByRole("button", { name: "Retry" }));

        expect(screen.getByRole("alert").textContent).toContain("Could not save the note");
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it.each(["too-large", "not-utf8"] as const)("explains %s without offering an action", (kind) => {
        render(<NoteBanner kind={kind} />);

        expect(screen.getByRole("status")).toBeTruthy();
        expect(screen.queryByRole("button")).toBeNull();
    });
});
