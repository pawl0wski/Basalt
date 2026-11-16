import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NewFolderDialog } from "./NewFolderDialog";
import { RenameDialog } from "./RenameDialog";

const texts = {
    nameLabel: "Name",
    cancelLabel: "Cancel",
    pendingLabel: "Working…",
};

function RenameHarness({
    onSubmit = () => {},
    onOpenChange = () => {},
    error,
    operationError,
    pending,
}: {
    onSubmit?: () => void;
    onOpenChange?: (open: boolean) => void;
    error?: string;
    operationError?: string;
    pending?: boolean;
}) {
    const [name, setName] = useState("Weekly plan");
    return (
        <RenameDialog
            open
            onOpenChange={onOpenChange}
            title="Rename note"
            submitLabel="Rename"
            {...texts}
            currentName="Weekly plan"
            name={name}
            onNameChange={setName}
            error={error}
            operationError={operationError}
            pending={pending}
            onSubmit={onSubmit}
        />
    );
}

function FolderHarness({
    onSubmit = () => {},
    onOpenChange = () => {},
    error,
    operationError,
    pending,
}: {
    onSubmit?: () => void;
    onOpenChange?: (open: boolean) => void;
    error?: string;
    operationError?: string;
    pending?: boolean;
}) {
    const [name, setName] = useState("");
    return (
        <NewFolderDialog
            open
            onOpenChange={onOpenChange}
            title="New folder"
            description="Created in projects."
            submitLabel="Create folder"
            {...texts}
            name={name}
            onNameChange={setName}
            error={error}
            operationError={operationError}
            pending={pending}
            onSubmit={onSubmit}
        />
    );
}

const input = () =>
    screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;

describe("RenameDialog", () => {
    it("shows the current name selected so typing replaces it", async () => {
        const user = userEvent.setup();
        render(<RenameHarness />);

        expect(
            screen.getByRole("dialog", { name: "Rename note" }),
        ).toBeTruthy();
        expect(document.activeElement).toBe(input());
        expect(input().value).toBe("Weekly plan");
        expect(input().selectionStart).toBe(0);
        expect(input().selectionEnd).toBe("Weekly plan".length);

        await user.keyboard("Roadmap");
        expect(input().value).toBe("Roadmap");
    });

    it("keeps Rename disabled and ignores Enter while the name is unchanged", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<RenameHarness onSubmit={onSubmit} />);

        await user.keyboard("{Enter}");

        expect(onSubmit).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Rename" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });

    it("allows a case-only change", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<RenameHarness onSubmit={onSubmit} />);

        await user.keyboard("weekly plan{Enter}");

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("submits on Enter once the name changed", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<RenameHarness onSubmit={onSubmit} />);

        await user.keyboard("Roadmap{Enter}");

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("cancels with Escape and with the Cancel button without submitting", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <RenameHarness onSubmit={onSubmit} onOpenChange={onOpenChange} />,
        );

        await user.keyboard("Roadmap{Escape}");
        expect(onOpenChange).toHaveBeenCalledWith(false);

        onOpenChange.mockClear();
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe("NewFolderDialog", () => {
    it("starts empty with the description and rejects an empty or blank name", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<FolderHarness onSubmit={onSubmit} />);

        expect(input().value).toBe("");
        expect(document.activeElement).toBe(input());
        expect(screen.getByText("Created in projects.")).toBeTruthy();

        await user.keyboard("{Enter}");
        await user.keyboard("   {Enter}");
        expect(onSubmit).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Create folder" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });

    it("submits on Enter with a name", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<FolderHarness onSubmit={onSubmit} />);

        await user.keyboard("Archive{Enter}");

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("shows a field error, marks the field invalid and blocks submit", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(
            <FolderHarness
                error="A folder named Archive already exists."
                onSubmit={onSubmit}
            />,
        );

        await user.keyboard("Archive{Enter}");

        expect(input().getAttribute("aria-invalid")).toBe("true");
        expect(
            screen.getByRole("textbox", {
                description: "A folder named Archive already exists.",
            }),
        ).toBe(input());
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows an operation error as an alert and keeps the dialog open and retryable", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <FolderHarness
                operationError="The workspace is read-only."
                onSubmit={onSubmit}
                onOpenChange={onOpenChange}
            />,
        );

        expect(screen.getByRole("alert").textContent).toBe(
            "The workspace is read-only.",
        );
        expect(screen.getByRole("dialog", { name: "New folder" })).toBeTruthy();
        expect(input().hasAttribute("aria-invalid")).toBe(false);

        await user.keyboard("Archive{Enter}");
        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("renders no alert without an operation error", () => {
        render(<FolderHarness />);

        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("disables submit and ignores Enter while busy, and shows the busy label", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<FolderHarness pending onSubmit={onSubmit} />);

        await user.keyboard("Archive{Enter}");

        expect(onSubmit).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Working…" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });

    it("keeps Cancel from submitting the form", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<FolderHarness onSubmit={onSubmit} />);

        await user.keyboard("Archive");
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
