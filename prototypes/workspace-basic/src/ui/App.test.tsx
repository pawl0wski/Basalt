import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SCREENS } from "../model/screens";
import { StoreProvider } from "../model/store";
import { Screens } from "./Screens";

function renderPrototype() {
    return render(
        <StoreProvider>
            <Screens />
        </StoreProvider>,
    );
}

const current = () => {
    const frames = SCREENS.filter(
        ({ id }) => document.querySelector(`#${id} .frame-host`) !== null,
    );
    expect(frames).toHaveLength(1);
    return frames[0].id;
};

const host = () => document.querySelector<HTMLElement>(".frame-host")!;

describe("prototype navigation", () => {
    afterEach(() => vi.useRealTimers());

    it("renders one section per screen id of the map, in order", () => {
        renderPrototype();
        expect(
            Array.from(document.querySelectorAll("section.screen")).map(
                (section) => section.id,
            ),
        ).toEqual(SCREENS.map((screen) => screen.id));
        expect(SCREENS).toHaveLength(14);
    });

    it("starts on s01 and moves s01 to s02 to s03 by clicking", async () => {
        const user = userEvent.setup();
        renderPrototype();
        expect(current()).toBe("s01");
        await user.click(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        );
        expect(current()).toBe("s02");
        await user.click(
            within(host()).getByRole("treeitem", { name: /Weekly plan/ }),
        );
        expect(current()).toBe("s03");
    });

    it("creates Untitled at once from New note, with no dialog", async () => {
        const user = userEvent.setup();
        renderPrototype();
        await user.click(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        );
        await user.click(
            within(host()).getByRole("treeitem", { name: /Weekly plan/ }),
        );
        await user.click(
            within(host()).getAllByRole("button", { name: "New note" })[0],
        );
        expect(current()).toBe("s04");
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(
            within(host()).getByRole("button", { name: "Close Untitled" }),
        ).toBeInTheDocument();
        expect(
            within(host()).getByRole("treeitem", { name: "Untitled" }),
        ).toBeInTheDocument();
    });

    it("shows the screen chosen in the screen map when the engine announces it", () => {
        renderPrototype();
        for (const { id } of SCREENS) {
            act(() => {
                document.dispatchEvent(
                    new CustomEvent("prototype:screen-change", { detail: id }),
                );
            });
            expect(current()).toBe(id);
        }
    });

    it("announces the screen to the engine when the app moves on its own", async () => {
        const user = userEvent.setup();
        const seen: string[] = [];
        const listener = (event: Event) =>
            seen.push((event as CustomEvent<string>).detail);
        document.addEventListener("prototype:navigate", listener);
        renderPrototype();
        await user.click(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        );
        document.removeEventListener("prototype:navigate", listener);
        expect(seen).toContain("s02");
    });

    it("autosaves typed text after the debounce and shows Saved", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderPrototype();
        await user.click(
            within(host()).getByRole("button", {
                name: "Open folder as workspace",
            }),
        );
        await user.click(
            within(host()).getByRole("treeitem", { name: /Ideas/ }),
        );
        await user.click(within(host()).getByText("A command palette"));
        await user.keyboard("{End} more");
        expect(
            within(host()).getByRole("status", { name: "" }).textContent,
        ).toContain("Not saved");
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100);
        });
        expect(
            within(host())
                .getAllByRole("status")
                .some((status) => status.textContent?.includes("Saving")),
        ).toBe(true);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });
        expect(
            within(host())
                .getAllByRole("status")
                .some((status) => status.textContent?.includes("Saved")),
        ).toBe(true);
    });
});
