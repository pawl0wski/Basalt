import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Menu } from "./Menu";

const setup = () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
        <Menu
            trigger={<Button>Actions</Button>}
            items={[
                { label: "Rename", onSelect: onRename },
                { label: "Duplicate", onSelect: () => {}, disabled: true },
                "separator",
                { label: "Delete note", onSelect: onDelete, destructive: true },
            ]}
        />,
    );
    return { onRename, onDelete };
};

describe("Menu", () => {
    it("opens from the keyboard and lists the actions", async () => {
        const user = userEvent.setup();
        setup();

        await user.tab();
        await user.keyboard("{Enter}");

        expect(screen.getByRole("menu", { name: "Actions" })).toBeTruthy();
        expect(
            screen.getAllByRole("menuitem").map((item) => item.textContent),
        ).toEqual(["Rename", "Duplicate", "Delete note"]);
    });

    it("selects with the arrow keys and Enter, then closes", async () => {
        const user = userEvent.setup();
        const { onRename, onDelete } = setup();

        await user.tab();
        await user.keyboard("{Enter}");
        await user.keyboard("{Enter}");

        expect(onRename).toHaveBeenCalledOnce();
        expect(onDelete).not.toHaveBeenCalled();
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("skips disabled items when moving with the arrow keys", async () => {
        const user = userEvent.setup();
        const { onDelete } = setup();

        await user.tab();
        await user.keyboard("{Enter}");
        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        expect(onDelete).toHaveBeenCalledOnce();
    });

    it("closes with Escape and returns focus to the trigger", async () => {
        const user = userEvent.setup();
        setup();

        await user.tab();
        await user.keyboard("{Enter}");
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("menu")).toBeNull();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Actions" }),
        );
    });

    it("marks disabled items as disabled", async () => {
        const user = userEvent.setup();
        setup();

        await user.tab();
        await user.keyboard("{Enter}");

        expect(
            screen
                .getByRole("menuitem", { name: "Duplicate" })
                .getAttribute("aria-disabled"),
        ).toBe("true");
    });
});
