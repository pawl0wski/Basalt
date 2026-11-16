import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tree } from "../product/Tree";
import type { TreePoint } from "../product/Tree";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuProps } from "./ContextMenu";

const point = { x: 40, y: 60 };

function setup(props: Partial<ContextMenuProps> = {}) {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const view = render(
        <ContextMenu
            label="Note actions"
            point={point}
            onClose={onClose}
            items={[
                { label: "Rename", onSelect: onRename },
                { label: "Duplicate", onSelect: () => {}, disabled: true },
                "separator",
                { label: "Delete", onSelect: onDelete, destructive: true },
            ]}
            {...props}
        />,
    );
    return { onRename, onDelete, onClose, ...view };
}

describe("ContextMenu", () => {
    it("opens as a named menu at the requested point and lists the items", async () => {
        setup();

        const menu = await screen.findByRole("menu", { name: "Note actions" });
        expect(
            screen.getAllByRole("menuitem").map((item) => item.textContent),
        ).toEqual(["Rename", "Duplicate", "Delete"]);
        expect(menu).toBeTruthy();
        expect(screen.getAllByRole("separator")).toHaveLength(1);
    });

    it("renders nothing while there is no point", () => {
        setup({ point: null });

        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("opens when the point appears and closes when it is cleared", async () => {
        const { rerender, onClose } = setup({ point: null });

        rerender(
            <ContextMenu
                label="Note actions"
                point={point}
                onClose={onClose}
                items={[{ label: "Rename", onSelect: () => {} }]}
            />,
        );
        expect(await screen.findByRole("menu")).toBeTruthy();

        rerender(
            <ContextMenu
                label="Note actions"
                point={null}
                onClose={onClose}
                items={[{ label: "Rename", onSelect: () => {} }]}
            />,
        );
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("selects with the arrow keys and Enter, skipping disabled items, then closes", async () => {
        const user = userEvent.setup();
        const { onRename, onDelete, onClose } = setup();
        await screen.findByRole("menu");

        await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

        expect(onDelete).toHaveBeenCalledOnce();
        expect(onRename).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("selects an item with the mouse", async () => {
        const user = userEvent.setup();
        const { onRename, onClose } = setup();

        await user.click(
            await screen.findByRole("menuitem", { name: "Rename" }),
        );

        expect(onRename).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not run a disabled item", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const { onClose } = setup({
            items: [{ label: "Duplicate", onSelect, disabled: true }],
        });

        const item = await screen.findByRole("menuitem", { name: "Duplicate" });
        await user.click(item);

        expect(item.getAttribute("aria-disabled")).toBe("true");
        expect(onSelect).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("closes with Escape without running an item", async () => {
        const user = userEvent.setup();
        const { onRename, onDelete, onClose } = setup();
        await screen.findByRole("menu");

        await user.keyboard("{Escape}");

        expect(onClose).toHaveBeenCalledOnce();
        expect(onRename).not.toHaveBeenCalled();
        expect(onDelete).not.toHaveBeenCalled();
    });

    it("marks the destructive item", async () => {
        setup();

        expect(
            (await screen.findByRole("menuitem", { name: "Delete" })).className,
        ).toContain("text-status-danger");
        expect(
            screen.getByRole("menuitem", { name: "Rename" }).className,
        ).not.toContain("text-status-danger");
    });

    it("lets the app decide where focus goes after closing", async () => {
        const user = userEvent.setup();
        const onCloseAutoFocus = vi.fn((event: Event) =>
            event.preventDefault(),
        );
        setup({ onCloseAutoFocus });
        await screen.findByRole("menu");

        await user.keyboard("{Escape}");

        expect(onCloseAutoFocus).toHaveBeenCalledOnce();
    });
});

describe("ContextMenu opened from a Tree", () => {
    function Harness({ onRename }: { onRename: () => void }) {
        const [open, setOpen] = useState<{
            id: string | null;
            point: TreePoint;
        } | null>(null);
        return (
            <>
                <Tree
                    label="Notes"
                    nodes={[
                        { kind: "note", id: "Ideas.md", name: "Ideas" },
                        { kind: "note", id: "Plan.md", name: "Plan" },
                    ]}
                    onToggleFolder={() => {}}
                    onOpenNote={() => {}}
                    onContextMenuRequest={(id, at) =>
                        setOpen({ id, point: at })
                    }
                />
                <ContextMenu
                    label={open?.id ? `Actions for ${open.id}` : "Workspace"}
                    point={open?.point ?? null}
                    onClose={() => setOpen(null)}
                    items={[{ label: "Rename", onSelect: onRename }]}
                />
            </>
        );
    }

    it("opens on right-click and runs an item from the keyboard", async () => {
        const user = userEvent.setup();
        const onRename = vi.fn();
        render(<Harness onRename={onRename} />);

        fireEvent.contextMenu(screen.getByRole("treeitem", { name: "Plan" }), {
            clientX: 10,
            clientY: 20,
        });
        expect(
            await screen.findByRole("menu", { name: "Actions for Plan.md" }),
        ).toBeTruthy();

        await user.keyboard("{ArrowDown}{Enter}");
        expect(onRename).toHaveBeenCalledOnce();
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("opens from the keyboard on the focused row and again for another row", async () => {
        const user = userEvent.setup();
        render(<Harness onRename={() => {}} />);

        await user.tab();
        await user.keyboard("{Shift>}{F10}{/Shift}");
        expect(
            await screen.findByRole("menu", { name: "Actions for Ideas.md" }),
        ).toBeTruthy();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("menu")).toBeNull();

        await act(async () => {
            screen.getByRole("treeitem", { name: "Plan" }).focus();
        });
        await user.keyboard("{ContextMenu}");
        expect(
            await screen.findByRole("menu", { name: "Actions for Plan.md" }),
        ).toBeTruthy();
    });
});
