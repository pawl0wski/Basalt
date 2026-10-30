import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Alert } from "../../src/components/Alert";
import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Input } from "../../src/components/Input";

type Scenario =
    "success" | "field-error" | "server-error" | "unavailable" | "pending";

type CreateResult =
    | { ok: true }
    | { ok: false; kind: "field"; message: string }
    | { ok: false; kind: "server"; message: string };

function createNote(name: string, scenario: Scenario): Promise<CreateResult> {
    return new Promise((resolve) => {
        const delay = scenario === "pending" ? 60_000 : 300;
        setTimeout(() => {
            if (scenario === "field-error") {
                resolve({
                    ok: false,
                    kind: "field",
                    message: `A note named ${name} already exists. Choose another name.`,
                });
            } else if (scenario === "server-error") {
                resolve({
                    ok: false,
                    kind: "server",
                    message:
                        "The note could not be written. Your name is kept, try again.",
                });
            } else if (scenario === "unavailable") {
                resolve({
                    ok: false,
                    kind: "server",
                    message:
                        "The workspace folder is not available. Reconnect the drive and try again.",
                });
            } else {
                resolve({ ok: true });
            }
        }, delay);
    });
}

function validate(name: string): string | undefined {
    if (name.trim() === "") return "Enter a name for the note.";
    if (/[\\/:*?"<>|]/.test(name))
        return 'A note name cannot contain / \\ : * ? " < > |.';
    return undefined;
}

function NewNoteForm({ scenario }: { scenario: Scenario }) {
    const [name, setName] = useState("");
    const [touched, setTouched] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [pending, setPending] = useState(false);
    const [fieldError, setFieldError] = useState<string>();
    const [serverError, setServerError] = useState<string>();
    const [created, setCreated] = useState<string>();
    const [focusRequest, setFocusRequest] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focusRequest > 0) inputRef.current?.focus();
    }, [focusRequest]);

    const clientError = touched || submitted ? validate(name) : undefined;
    const error = clientError ?? fieldError;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (pending) return;
        setSubmitted(true);
        setServerError(undefined);
        if (validate(name)) {
            setFocusRequest((count) => count + 1);
            return;
        }
        setPending(true);
        const result = await createNote(name, scenario);
        setPending(false);
        if (result.ok) {
            setCreated(name);
        } else if (result.kind === "field") {
            setFieldError(result.message);
            setFocusRequest((count) => count + 1);
        } else {
            setServerError(result.message);
        }
    };

    if (created) {
        return (
            <Alert title="Note created">{`${created}.md is saved in your workspace folder.`}</Alert>
        );
    }

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            aria-busy={pending}
            className="flex w-full max-w-prose flex-col gap-between-groups"
        >
            {serverError ? (
                <Alert variant="danger" title="Could not create the note">
                    {serverError}
                </Alert>
            ) : null}
            <Field
                label="Note name"
                required
                hint="The name becomes the file name."
                error={error}
            >
                <Input
                    ref={inputRef}
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        setFieldError(undefined);
                    }}
                    onBlur={() => setTouched(true)}
                    disabled={pending}
                />
            </Field>
            <div>
                <Button type="submit" disabled={pending}>
                    {pending ? "Creating…" : "Create note"}
                </Button>
            </div>
        </form>
    );
}

const meta = {
    title: "Patterns/Form",
    component: NewNoteForm,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: { scenario: "success" },
    argTypes: {
        scenario: {
            control: "select",
            options: [
                "success",
                "field-error",
                "server-error",
                "unavailable",
                "pending",
            ],
        },
    },
} satisfies Meta<typeof NewNoteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByLabelText("Note name"),
            "Weekly plan{Enter}",
        );
        await waitFor(
            () =>
                expect(canvas.getByRole("status")).toHaveTextContent(
                    "Weekly plan.md is saved",
                ),
            { timeout: 2000 },
        );
    },
};

export const ValidatesOnLeavingTheField: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText("Note name");
        await userEvent.click(input);
        await expect(input).toBeValid();
        await userEvent.tab();
        await expect(input).toBeInvalid();
        await expect(
            canvas.getByText("Enter a name for the note."),
        ).toBeVisible();
    },
};

export const FailedSubmitFocusesFirstError: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: "Create note" }),
        );
        await expect(canvas.getByLabelText("Note name")).toHaveFocus();
        await expect(canvas.getByLabelText("Note name")).toBeInvalid();
    },
};

export const FieldErrorFromTheServer: Story = {
    args: { scenario: "field-error" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText("Note name");
        await userEvent.type(input, "Weekly plan{Enter}");
        await waitFor(
            () => expect(canvas.getByText(/already exists/)).toBeVisible(),
            { timeout: 2000 },
        );
        await expect(input).toHaveValue("Weekly plan");
        await waitFor(() => expect(input).toHaveFocus());
    },
};

export const ServerErrorKeepsTheInput: Story = {
    args: { scenario: "server-error" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByLabelText("Note name"),
            "Weekly plan{Enter}",
        );
        await waitFor(
            () =>
                expect(canvas.getByRole("alert")).toHaveTextContent(
                    "Could not create the note",
                ),
            { timeout: 2000 },
        );
        await expect(canvas.getByLabelText("Note name")).toHaveValue(
            "Weekly plan",
        );
        await expect(
            canvas.getByRole("button", { name: "Create note" }),
        ).toBeEnabled();
    },
};

export const FolderUnavailable: Story = { args: { scenario: "unavailable" } };

export const PendingBlocksASecondSubmit: Story = {
    args: { scenario: "pending" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByLabelText("Note name"),
            "Weekly plan{Enter}",
        );
        const button = await canvas.findByRole("button", { name: "Creating…" });
        await expect(button).toBeDisabled();
        await expect(canvas.getByLabelText("Note name")).toBeDisabled();
    },
};
