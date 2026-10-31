import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NewNoteDialog } from "./NewNoteDialog";
import { SaveFailedDialog } from "./SaveFailedDialog";

describe("SaveFailedDialog", () => {
    const setup = () => {
        const handlers = {
            onRetry: vi.fn(),
            onDiscard: vi.fn(),
            onCancel: vi.fn(),
        };
        render(<SaveFailedDialog open noteName="Weekly plan" {...handlers} />);
        return handlers;
    };

    it("names the note and offers retry, discard and cancel", () => {
        setup();

        expect(
            screen.getByRole("alertdialog", {
                name: 'Could not save "Weekly plan"',
            }),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Discard changes" }),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    });

    it("puts focus on Retry, the choice that keeps the text", () => {
        setup();

        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Retry" }),
        );
    });

    it("reports each choice separately", async () => {
        const user = userEvent.setup();
        const handlers = setup();

        await user.click(
            screen.getByRole("button", { name: "Discard changes" }),
        );
        expect(handlers.onDiscard).toHaveBeenCalledOnce();
        expect(handlers.onRetry).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Retry" }));
        expect(handlers.onRetry).toHaveBeenCalledOnce();
    });

    it("treats Escape as cancel, never as discard", async () => {
        const user = userEvent.setup();
        const handlers = setup();

        await user.keyboard("{Escape}");

        expect(handlers.onCancel).toHaveBeenCalledOnce();
        expect(handlers.onDiscard).not.toHaveBeenCalled();
    });
});

describe("NewNoteDialog", () => {
    function Harness({
        error,
        pending,
        onCreate,
    }: {
        error?: string;
        pending?: boolean;
        onCreate: () => void;
    }) {
        const [name, setName] = useState("Untitled");
        return (
            <NewNoteDialog
                open
                onOpenChange={() => {}}
                name={name}
                onNameChange={setName}
                error={error}
                pending={pending}
                onCreate={onCreate}
            />
        );
    }

    it("is prefilled and creates on submit", async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();

        render(<Harness onCreate={onCreate} />);
        expect(
            (
                screen.getByRole("textbox", {
                    name: "Note name",
                }) as HTMLInputElement
            ).value,
        ).toBe("Untitled");
        await user.keyboard("{Enter}");

        expect(onCreate).toHaveBeenCalledOnce();
    });

    it("shows the inline error, marks the field invalid and disables Create", async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();

        render(
            <Harness
                error="A note named Untitled already exists."
                onCreate={onCreate}
            />,
        );

        const input = screen.getByRole("textbox", { name: "Note name" });
        expect(input.getAttribute("aria-invalid")).toBe("true");
        expect(
            screen.getByRole("textbox", {
                description: "A note named Untitled already exists.",
            }),
        ).toBe(input);
        expect(
            screen
                .getByRole("button", { name: "Create note" })
                .hasAttribute("disabled"),
        ).toBe(true);

        await user.type(input, "{Enter}");
        expect(onCreate).not.toHaveBeenCalled();
    });

    it("does not create an empty name", async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();

        render(<Harness onCreate={onCreate} />);
        await user.clear(screen.getByRole("textbox"));
        await user.keyboard("{Enter}");

        expect(onCreate).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Create note" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });

    it("blocks a second submit while creating", async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();

        render(<Harness pending onCreate={onCreate} />);
        await user.type(screen.getByRole("textbox"), "{Enter}");

        expect(onCreate).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Creating…" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });
});
