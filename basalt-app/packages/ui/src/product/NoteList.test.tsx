import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoteList } from "./NoteList";

const notes = [
    { path: "Ideas.md", name: "Ideas" },
    { path: "projects/Roadmap.md", name: "Roadmap" },
    { path: "Weekly plan.md", name: "Weekly plan" },
];

const setup = (props: Partial<React.ComponentProps<typeof NoteList>> = {}) => {
    const onSelect = vi.fn();
    render(
        <NoteList label="Notes" notes={notes} onSelect={onSelect} {...props} />,
    );
    return { onSelect };
};

describe("NoteList", () => {
    it("is a labelled listbox with one option per note and the selected one marked", () => {
        setup({ selectedPath: "Weekly plan.md" });

        expect(screen.getByRole("listbox", { name: "Notes" })).toBeTruthy();
        expect(screen.getAllByRole("option")).toHaveLength(3);
        expect(
            screen
                .getByRole("option", { name: "Weekly plan" })
                .getAttribute("aria-selected"),
        ).toBe("true");
        expect(
            screen
                .getByRole("option", { name: "Ideas" })
                .getAttribute("aria-selected"),
        ).toBe("false");
    });

    it("shows the folder of a note in a sub-folder next to its name", () => {
        setup();

        expect(
            screen.getByRole("option", { name: "projects/ Roadmap" }),
        ).toBeTruthy();
    });

    it("selects a note on click", async () => {
        const user = userEvent.setup();
        const { onSelect } = setup();

        await user.click(screen.getByRole("option", { name: "Ideas" }));

        expect(onSelect).toHaveBeenCalledWith("Ideas.md");
    });

    it("has one tab stop that starts on the selected note", async () => {
        const user = userEvent.setup();
        setup({ selectedPath: "Weekly plan.md" });

        await user.tab();

        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "Weekly plan" }),
        );
        expect(
            screen
                .getByRole("option", { name: "Ideas" })
                .getAttribute("tabindex"),
        ).toBe("-1");
    });

    it("moves focus with the arrow keys, Home and End, wrapping around, and selects with Enter or Space", async () => {
        const user = userEvent.setup();
        const { onSelect } = setup();

        await user.tab();
        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "Ideas" }),
        );
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "projects/ Roadmap" }),
        );
        await user.keyboard("{End}");
        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "Weekly plan" }),
        );
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "Ideas" }),
        );
        await user.keyboard("{ArrowUp}");
        expect(document.activeElement).toBe(
            screen.getByRole("option", { name: "Weekly plan" }),
        );
        await user.keyboard("{Home}");
        await user.keyboard("{Enter}");
        await user.keyboard(" ");

        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(onSelect).toHaveBeenLastCalledWith("Ideas.md");
    });

    it("announces loading instead of the list", () => {
        setup({ status: "loading" });

        expect(screen.queryByRole("listbox")).toBeNull();
        expect(screen.getByRole("status").textContent).toContain(
            "Loading notes",
        );
        expect(screen.getByRole("status").getAttribute("aria-busy")).toBe(
            "true",
        );
    });

    it("shows the empty slot when there are no notes and the error slot on error", () => {
        const { rerender } = render(
            <NoteList
                label="Notes"
                notes={[]}
                onSelect={() => {}}
                empty={<p>Create your first note</p>}
            />,
        );
        expect(screen.getByText("Create your first note")).toBeTruthy();
        expect(screen.queryByRole("listbox")).toBeNull();

        rerender(
            <NoteList
                label="Notes"
                notes={notes}
                status="error"
                onSelect={() => {}}
                error={<p>Could not read the folder</p>}
            />,
        );
        expect(screen.getByText("Could not read the folder")).toBeTruthy();
        expect(screen.queryByRole("option")).toBeNull();
    });

    it("keeps working when the list shrinks below the focused position", async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <NoteList label="Notes" notes={notes} onSelect={() => {}} />,
        );
        await user.tab();
        await user.keyboard("{End}");

        rerender(
            <NoteList
                label="Notes"
                notes={notes.slice(0, 1)}
                onSelect={() => {}}
            />,
        );

        expect(
            screen
                .getByRole("option", { name: "Ideas" })
                .getAttribute("tabindex"),
        ).toBe("0");
    });
});
