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
});
