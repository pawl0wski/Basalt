import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Bookmark, Files, Search, Settings } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ActivityBar } from "./ActivityBar";

const items = [
    { id: "notes", label: "Notes", icon: <Files aria-hidden="true" /> },
    { id: "search", label: "Search", icon: <Search aria-hidden="true" /> },
    {
        id: "bookmarks",
        label: "Bookmarks",
        icon: <Bookmark aria-hidden="true" />,
    },
];
const footerItems = [
    {
        id: "settings",
        label: "Settings",
        icon: <Settings aria-hidden="true" />,
    },
];

describe("ActivityBar", () => {
    it("marks only the active section as the current page", () => {
        render(
            <ActivityBar
                items={items}
                footerItems={footerItems}
                activeId="search"
                onSelect={() => {}}
            />,
        );

        const nav = screen.getByRole("navigation", { name: "Sections" });
        const current = nav.querySelectorAll('[aria-current="page"]');
        expect(current).toHaveLength(1);
        expect(current[0]).toBe(screen.getByRole("button", { name: "Search" }));
    });

    it("reports the id of the clicked section, including the footer", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <ActivityBar
                items={items}
                footerItems={footerItems}
                activeId="notes"
                onSelect={onSelect}
            />,
        );
        await user.click(screen.getByRole("button", { name: "Bookmarks" }));
        await user.click(screen.getByRole("button", { name: "Settings" }));

        expect(onSelect.mock.calls).toEqual([["bookmarks"], ["settings"]]);
    });

    it("lists the footer sections after the main ones", () => {
        render(
            <ActivityBar
                items={items}
                footerItems={footerItems}
                onSelect={() => {}}
            />,
        );

        expect(
            screen.getAllByRole("button").map((button) => button.ariaLabel),
        ).toEqual(["Notes", "Search", "Bookmarks", "Settings"]);
    });

    it("has no current section when none is active", () => {
        render(<ActivityBar items={items} onSelect={() => {}} />);

        expect(document.querySelector("[aria-current]")).toBeNull();
    });
});
