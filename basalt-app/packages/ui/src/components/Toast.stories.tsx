import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { ToastProvider } from "./Toast";
import type { ToastKind } from "./toastContext";
import { useToast } from "./toastContext";

const onUndo = fn();

function Demo({
    withAction = false,
    duration,
    kind,
}: {
    withAction?: boolean;
    duration?: number;
    kind?: ToastKind;
}) {
    const toast = useToast();
    return (
        <Button
            variant="secondary"
            onClick={() =>
                toast({
                    kind,
                    title: "Note moved to trash",
                    description: "Weekly plan",
                    duration,
                    action: withAction
                        ? { label: "Undo", onClick: onUndo }
                        : undefined,
                })
            }
        >
            Delete note
        </Button>
    );
}

const meta = {
    title: "Primitives/Toast",
    component: ToastProvider,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: { children: null },
    render: () => (
        <ToastProvider>
            <Demo />
        </ToastProvider>
    ),
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Delete note" }),
        );
        await expect(
            (await screen.findAllByText("Note moved to trash"))[0],
        ).toBeVisible();
        await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
        await expect(screen.queryByText("Weekly plan")).toBeNull();
    },
};

export const WithAction: Story = {
    render: () => (
        <ToastProvider>
            <Demo withAction />
        </ToastProvider>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Delete note" }),
        );
        await userEvent.click(
            await screen.findByRole("button", { name: "Undo" }),
        );
        await expect(onUndo).toHaveBeenCalledTimes(1);
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: () => (
        <ToastProvider>
            <Demo withAction />
        </ToastProvider>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Delete note" }),
        );
        await expect(
            (await screen.findAllByText("Note moved to trash"))[0],
        ).toBeVisible();
    },
};

export const StackCap: Story = {
    render: () => (
        <ToastProvider>
            <Demo />
        </ToastProvider>
    ),
    play: async ({ canvasElement }) => {
        const open = within(canvasElement).getByRole("button", {
            name: "Delete note",
        });
        for (let index = 0; index < 4; index += 1) await userEvent.click(open);
        await screen.findAllByText("Note moved to trash");
        await expect(
            screen.getAllByRole("button", { name: "Dismiss" }),
        ).toHaveLength(3);
    },
};

const KINDS: { kind: ToastKind; word: string }[] = [
    { kind: "info", word: "Info" },
    { kind: "warning", word: "Warning" },
    { kind: "danger", word: "Error" },
];

function KindMatrix() {
    const toast = useToast();
    return (
        <div className="flex gap-between-groups">
            {KINDS.map(({ kind, word }) => (
                <Button
                    key={kind}
                    variant="secondary"
                    onClick={() =>
                        toast({
                            kind,
                            title: "Could not move the note",
                            description: "Weekly plan",
                            duration: 60000,
                        })
                    }
                >
                    {word}
                </Button>
            ))}
        </div>
    );
}

export const Kinds: Story = {
    render: () => (
        <ToastProvider>
            <KindMatrix />
        </ToastProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const { word } of KINDS)
            await userEvent.click(canvas.getByRole("button", { name: word }));
        const region = screen.getByRole("region", { name: /Notifications/ });
        for (const { word } of KINDS)
            await expect(region).toHaveTextContent(word);
    },
};

export const LongContent: Story = {
    render: () => (
        <ToastProvider>
            <Demo kind="warning" withAction />
        </ToastProvider>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Delete note" }),
        );
        await expect(
            (await screen.findAllByText("Note moved to trash"))[0],
        ).toBeVisible();
    },
};
