import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SCREEN_NOTES } from "../model/screenNotes";
import { SCREENS } from "../model/screens";
import { StoreProvider } from "../model/store";
import { SCREEN_IDS } from "../model/types";
import type { ScreenId } from "../model/types";
import { App } from "./App";
import { Screens } from "./Screens";

const goto = (id: ScreenId) =>
    act(() => {
        document.dispatchEvent(
            new CustomEvent("prototype:screen-change", { detail: id }),
        );
    });

const host = () => document.querySelector<HTMLElement>(".frame-host")!;

const expectations: Record<ScreenId, () => void> = {
    s01: () =>
        expect(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        ).toBeInTheDocument(),
    s02: () => {
        expect(
            within(host()).getByRole("tree", { name: "Notes" }),
        ).toBeInTheDocument();
        expect(
            within(host()).getByText("No note selected"),
        ).toBeInTheDocument();
    },
    s03: () => {
        expect(
            within(host()).getByRole("button", { name: "Close Weekly plan" }),
        ).toBeInTheDocument();
        expect(
            within(host()).getByRole("textbox", { name: "Markdown line 1" }),
        ).toBeInTheDocument();
    },
    s04: () => {
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(
            within(host()).getByRole("button", { name: "Close Untitled" }),
        ).toBeInTheDocument();
    },
    s05: () => {
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toHaveTextContent('Could not save "Weekly plan"');
        expect(
            within(dialog).getByRole("button", { name: "Retry" }),
        ).toHaveFocus();
    },
    s06: () => {
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toHaveTextContent("Load the version from disk?");
        expect(
            within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
    },
    s07: () => {
        expect(
            within(host()).getByText("Image could not be read"),
        ).toBeInTheDocument();
        expect(
            within(host()).getAllByText(/Image not found/).length,
        ).toBeGreaterThan(0);
    },
    s08: () =>
        expect(
            within(host()).getByRole("img", {
                name: "Pasted image 20261025143012",
            }),
        ).toBeInTheDocument(),
    s09: () => {
        expect(
            within(host()).getByRole("tree", { name: "Notes" }),
        ).toBeInTheDocument();
        expect(
            within(host()).getByRole("treeitem", { name: "projects" }),
        ).toHaveAttribute("aria-expanded", "true");
    },
    s10: () => {
        expect(
            screen.getByRole("menuitem", { name: "New note" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("menuitem", { name: "New folder" }),
        ).toBeInTheDocument();
    },
    s11: () =>
        expect(
            screen.getByRole("dialog", { name: "Rename note" }),
        ).toBeInTheDocument(),
    s12: () =>
        expect(
            screen.getByRole("dialog", { name: "New folder" }),
        ).toBeInTheDocument(),
    s13: () => {
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toHaveTextContent('Delete "Weekly plan"?');
        expect(
            within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
    },
    s14: () => {
        expect(
            within(host()).getByRole("treeitem", { name: "projects" }),
        ).toBeInTheDocument();
        expect(host().querySelector(".bg-state-selected")).not.toBeNull();
    },
};

describe("screen map", () => {
    it("lists the 14 screen ids of the approved map in order", () => {
        expect(SCREEN_IDS).toEqual(
            Array.from(
                { length: 14 },
                (_, index) => `s${String(index + 1).padStart(2, "0")}`,
            ),
        );
        expect(SCREENS.map((s) => s.id)).toEqual([...SCREEN_IDS]);
    });

    it("has a navigation link, a section and a note for every screen", () => {
        render(<App />);
        for (const id of SCREEN_IDS) {
            const link = document.querySelector(`.screen-nav a[href="#${id}"]`);
            expect(link, `link for ${id}`).not.toBeNull();
            const section = document.getElementById(id);
            expect(section?.querySelector(".frame")).not.toBeNull();
            expect(section?.querySelector(".screen-notes")).toHaveTextContent(
                SCREEN_NOTES[id].stories,
            );
        }
    });
});

describe.each(SCREEN_IDS)("screen %s", (id) => {
    it("shows its characteristic content when chosen in the screen map", () => {
        render(
            <StoreProvider>
                <Screens />
            </StoreProvider>,
        );
        goto(id);
        expect(document.querySelector(`#${id} .frame-host`)).not.toBeNull();
        expectations[id]();
    });
});

describe("moving between screens", () => {
    it("keeps the app state when the review bar moves to another screen and back", () => {
        render(
            <StoreProvider>
                <Screens />
            </StoreProvider>,
        );
        goto("s03");
        goto("s09");
        expect(
            within(host()).getByRole("button", { name: "Close Weekly plan" }),
        ).toBeInTheDocument();
        goto("s01");
        expect(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        ).toBeInTheDocument();
    });
});

describe("opening the prototype with a screen in the address", () => {
    it("shows that screen when the engine starts before the first effects settle", () => {
        let started = false;
        const start = () => {
            started = true;
            document.dispatchEvent(
                new CustomEvent("prototype:screen-change", { detail: "s09" }),
            );
            return true;
        };
        window.__PROTOTYPE_START__ = start;
        render(<App />);
        expect(started).toBe(true);
        expect(document.querySelector("#s09 .frame-host")).not.toBeNull();
        expect(
            within(document.querySelector("#s09")!).getByRole("tree", {
                name: "Notes",
            }),
        ).toBeInTheDocument();
        delete window.__PROTOTYPE_START__;
    });

    it("does not send the app back to s01 when the engine starts", () => {
        const seen: string[] = [];
        const listener = (event: Event) =>
            seen.push((event as CustomEvent<string>).detail);
        document.addEventListener("prototype:navigate", listener);
        window.__PROTOTYPE_START__ = () => true;
        render(<App />);
        document.removeEventListener("prototype:navigate", listener);
        delete window.__PROTOTYPE_START__;
        expect(seen).toEqual([]);
    });
});

function renderOn(id: ScreenId) {
    render(
        <StoreProvider>
            <Screens />
        </StoreProvider>,
    );
    goto(id);
}

describe("item actions menu", () => {
    it("has no button on the rows and opens with a right-click", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        expect(
            within(host()).queryByRole("button", { name: /^Actions for/ }),
        ).toBeNull();
        await user.pointer({
            keys: "[MouseRight]",
            target: within(host()).getByRole("treeitem", { name: "Ideas" }),
        });
        expect(
            screen.getByRole("menu", { name: "Actions for Ideas" }),
        ).toBeInTheDocument();
        await user.keyboard("{ArrowDown}{ArrowDown}");
        expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
        await user.keyboard("{Enter}");
        expect(screen.getByRole("alertdialog")).toHaveTextContent(
            'Delete "Ideas"?',
        );
    });

    it("opens for the focused row with Shift+F10", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        within(host()).getByRole("treeitem", { name: "projects" }).focus();
        await user.keyboard("{Shift>}{F10}{/Shift}");
        expect(
            screen.getByRole("menu", { name: "Actions for projects" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("menuitem", { name: "New note" }),
        ).toBeVisible();
    });

    it("creates Untitled inside the folder from the folder menu, with no dialog", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        await user.pointer({
            keys: "[MouseRight]",
            target: within(host()).getByRole("treeitem", { name: "projects" }),
        });
        await user.click(screen.getByRole("menuitem", { name: "New note" }));
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(
            within(host()).getByRole("button", { name: "Close Untitled" }),
        ).toBeInTheDocument();
    });

    it("opens the workspace menu from the empty area of the tree", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        await user.pointer({
            keys: "[MouseRight]",
            target: within(host()).getByText("Workspace folder"),
        });
        expect(
            screen.getByRole("menu", { name: "Workspace actions" }),
        ).toBeInTheDocument();
    });
});

describe("selecting several notes", () => {
    const row = (name: string) =>
        within(host()).getByRole("treeitem", { name });

    it("selects with Ctrl+click and Shift+click, and Escape clears", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        await user.click(row("Ideas"));
        await user.keyboard("{Control>}");
        await user.click(row("Shopping"));
        await user.keyboard("{/Control}");
        expect(row("Ideas")).toHaveAttribute("aria-selected", "true");
        expect(row("Shopping")).toHaveAttribute("aria-selected", "true");
        expect(row("Reading list")).toHaveAttribute("aria-selected", "false");
        await user.keyboard("{Shift>}");
        await user.click(row("Reading list"));
        await user.keyboard("{/Shift}");
        expect(row("Reading list")).toHaveAttribute("aria-selected", "true");
        expect(row("Shopping")).toHaveAttribute("aria-selected", "true");
        expect(row("Ideas")).toHaveAttribute("aria-selected", "false");
        row("Reading list").focus();
        await user.keyboard("{Escape}");
        expect(row("Reading list")).toHaveAttribute("aria-selected", "false");
        expect(row("Shopping")).toHaveAttribute("aria-selected", "false");
        expect(row("Ideas")).toHaveAttribute("aria-selected", "true");
    });

    it("deletes all selected notes at once from the context menu", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        await user.click(row("Ideas"));
        await user.keyboard("{Control>}");
        await user.click(row("Shopping"));
        await user.keyboard("{/Control}");
        await user.pointer({ keys: "[MouseRight]", target: row("Shopping") });
        expect(
            screen.getByRole("menu", { name: "Actions for 2 notes" }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("menuitem", { name: "Rename" })).toBeNull();
        await user.click(
            screen.getByRole("menuitem", { name: "Delete 2 notes" }),
        );
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toHaveTextContent("Delete 2 notes?");
        await user.click(
            within(dialog).getByRole("button", { name: "Delete 2 notes" }),
        );
        expect(
            within(host()).queryByRole("treeitem", { name: "Ideas" }),
        ).toBeNull();
        expect(
            within(host()).queryByRole("treeitem", { name: "Shopping" }),
        ).toBeNull();
        expect(row("Reading list")).toBeInTheDocument();
    });

    it("moves all selected notes when one of them is dragged onto a folder", async () => {
        const user = userEvent.setup();
        renderOn("s09");
        await user.click(row("Ideas"));
        await user.keyboard("{Control>}");
        await user.click(row("Shopping"));
        await user.keyboard("{/Control}");
        const dataTransfer = { setData: () => undefined };
        fireEvent.dragStart(row("Shopping"), { dataTransfer });
        const folder = row("projects");
        fireEvent.dragOver(folder, { dataTransfer });
        fireEvent.drop(folder, { dataTransfer });
        const group = row("projects").closest("li")!;
        expect(
            within(group).getByRole("treeitem", { name: "Ideas" }),
        ).toBeInTheDocument();
        expect(
            within(group).getByRole("treeitem", { name: "Shopping" }),
        ).toBeInTheDocument();
        expect(row("Reading list")).toBeInTheDocument();
    });
});

describe("workspace window", () => {
    it("shows the workspace name and has no Change workspace button", () => {
        renderOn("s09");
        const sidebar = within(host()).getByRole("navigation", {
            name: "Workspace",
        });
        expect(within(sidebar).getByText("Basalt notes")).toBeInTheDocument();
        expect(
            within(host()).queryByRole("button", { name: "Change workspace" }),
        ).toBeNull();
    });

    it("opens the picker with Ctrl+O", async () => {
        const user = userEvent.setup();
        renderOn("s03");
        await user.keyboard("{Control>}o{/Control}");
        expect(
            within(host()).queryByRole("button", { name: "Close Weekly plan" }),
        ).toBeNull();
        expect(
            within(host()).getByRole("tree", { name: "Notes" }),
        ).toBeInTheDocument();
    });

    it("creates Untitled with Ctrl+N", async () => {
        const user = userEvent.setup();
        renderOn("s03");
        await user.keyboard("{Control>}n{/Control}");
        expect(
            within(host()).getByRole("button", { name: "Close Untitled" }),
        ).toBeInTheDocument();
    });

    it("animates the sidebar by keeping it mounted and marking it closed", async () => {
        const user = userEvent.setup();
        renderOn("s03");
        const sidebar = within(host()).getByRole("navigation", {
            name: "Workspace",
        });
        const wrapper = sidebar.closest<HTMLElement>(".proto-collapsible")!;
        expect(wrapper).toHaveAttribute("data-open", "true");
        await user.click(
            within(host()).getByRole("button", { name: "Toggle sidebar" }),
        );
        expect(wrapper).toHaveAttribute("data-open", "false");
        expect(wrapper).toHaveAttribute("inert");
    });

    it("shows only the save state in the status bar, without counts", () => {
        renderOn("s03");
        const bar = host().querySelector(".bs-status-bar");
        expect(bar).not.toBeNull();
        expect(bar).not.toHaveTextContent(/words?|characters?/i);
    });

    it("has an outline panel without a second close button", async () => {
        const user = userEvent.setup();
        renderOn("s03");
        await user.click(
            within(host()).getByRole("button", { name: "Toggle right panel" }),
        );
        expect(
            within(host()).getByRole("complementary", { name: "Outline" }),
        ).toBeInTheDocument();
        expect(
            within(host()).queryByRole("button", { name: "Close Outline" }),
        ).toBeNull();
    });
});

describe("new note and tabs", () => {
    it("puts the cursor in a new note so typing works at once", async () => {
        const user = userEvent.setup();
        renderOn("s03");
        await user.click(
            within(host()).getAllByRole("button", { name: "New note" })[0],
        );
        const input = within(host()).getByRole("textbox", {
            name: "Markdown line 1",
        });
        expect(input).toHaveFocus();
        await user.keyboard("Hello");
        expect(input).toHaveValue("Hello");
    });

    it("closes a tab with a middle click", () => {
        renderOn("s03");
        const tabs = () => host().querySelectorAll(".bs-note-tab");
        expect(tabs()).toHaveLength(2);
        const meeting = tabs()[0].querySelector("button")!;
        fireEvent(
            meeting,
            new MouseEvent("auxclick", { bubbles: true, button: 1 }),
        );
        expect(tabs()).toHaveLength(1);
        expect(
            within(host()).queryByRole("button", {
                name: "Close Meeting notes",
            }),
        ).toBeNull();
    });

    it("ignores a middle click outside the tabs and a left auxclick", () => {
        renderOn("s03");
        fireEvent(
            host().querySelector(".bs-note-tab button")!,
            new MouseEvent("auxclick", { bubbles: true, button: 2 }),
        );
        expect(host().querySelectorAll(".bs-note-tab")).toHaveLength(2);
    });
});

describe("live preview", () => {
    it("shows the source of the cursor line in place, without a boxed input", () => {
        renderOn("s03");
        const input = within(host()).getByRole("textbox", {
            name: "Markdown line 1",
        });
        expect(input.className).toContain("bg-transparent");
        expect(input.className).not.toContain("bg-editor-selection");
    });
});
