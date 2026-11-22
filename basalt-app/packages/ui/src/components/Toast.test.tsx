import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "./Toast";
import { useToast } from "./toastContext";

function Trigger({ onUndo }: { onUndo?: () => void }) {
    const toast = useToast();
    return (
        <button
            type="button"
            onClick={() =>
                toast({
                    title: "Note moved to trash",
                    description: "Weekly plan",
                    action: onUndo
                        ? { label: "Undo", onClick: onUndo }
                        : undefined,
                })
            }
        >
            Delete
        </button>
    );
}

describe("Toast", () => {
    it("shows a message with its description in the notifications region", async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Delete" }));

        await screen.findAllByText("Note moved to trash");
        const region = screen.getByRole("region", { name: /Notifications/ });
        expect(region.textContent).toContain("Note moved to trash");
        expect(region.textContent).toContain("Weekly plan");
    });

    it("can be dismissed", async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await screen.findAllByText("Note moved to trash");
        await user.click(screen.getByRole("button", { name: "Dismiss" }));

        expect(screen.queryByText("Note moved to trash")).toBeNull();
    });

    it("runs the action", async () => {
        const user = userEvent.setup();
        const onUndo = vi.fn();

        render(
            <ToastProvider>
                <Trigger onUndo={onUndo} />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await user.click(await screen.findByRole("button", { name: "Undo" }));

        expect(onUndo).toHaveBeenCalledOnce();
    });

    it("disappears by itself after its duration", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        function Short() {
            const toast = useToast();
            return (
                <button
                    type="button"
                    onClick={() => toast({ title: "Saved", duration: 1000 })}
                >
                    Save
                </button>
            );
        }
        render(
            <ToastProvider>
                <Short />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Saved")).toBeTruthy();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });

        expect(screen.queryByText("Saved")).toBeNull();
        vi.useRealTimers();
    });

    it("fails clearly when used outside the provider", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        function Orphan() {
            useToast();
            return null;
        }

        expect(() => render(<Orphan />)).toThrow(
            "useToast must be used inside ToastProvider",
        );
        spy.mockRestore();
    });

    it("keeps at most three toasts and drops the oldest", async () => {
        const user = userEvent.setup();
        function Many() {
            const toast = useToast();
            return (
                <button
                    type="button"
                    onClick={() => {
                        for (const name of ["one", "two", "three", "four"])
                            toast({ title: `Toast ${name}` });
                    }}
                >
                    Fire
                </button>
            );
        }
        render(
            <ToastProvider>
                <Many />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Fire" }));
        await screen.findAllByText("Toast four");

        expect(screen.queryByText("Toast one")).toBeNull();
        expect(screen.getAllByText("Toast two").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Toast three").length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: "Dismiss" })).toHaveLength(
            3,
        );
    });

    it("dismisses only the toast whose close button was used", async () => {
        const user = userEvent.setup();
        function Two() {
            const toast = useToast();
            return (
                <button
                    type="button"
                    onClick={() => {
                        toast({ title: "First" });
                        toast({ title: "Second" });
                    }}
                >
                    Fire
                </button>
            );
        }
        render(
            <ToastProvider>
                <Two />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Fire" }));
        await screen.findAllByText("Second");
        await user.click(screen.getAllByRole("button", { name: "Dismiss" })[0]);

        expect(screen.queryByText("First")).toBeNull();
        expect(screen.getAllByText("Second").length).toBeGreaterThan(0);
    });

    it("uses the given region and dismiss labels", async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider label="Powiadomienia" dismissLabel="Zamknij">
                <Trigger />
            </ToastProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await screen.findAllByText("Note moved to trash");

        expect(
            screen.getByRole("region", { name: /Powiadomienia/ }),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "Zamknij" })).toBeTruthy();
    });
});
