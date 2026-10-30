import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { ToastProvider } from "./Toast";
import { useToast } from "./toastContext";

const onUndo = fn();

function Demo({ withAction = false, duration }: { withAction?: boolean; duration?: number }) {
    const toast = useToast();
    return (
        <Button
            variant="secondary"
            onClick={() =>
                toast({
                    title: "Note moved to trash",
                    description: "Weekly plan",
                    duration,
                    action: withAction ? { label: "Undo", onClick: onUndo } : undefined,
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
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        await expect((await screen.findAllByText("Note moved to trash"))[0]).toBeVisible();
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
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
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
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        await expect((await screen.findAllByText("Note moved to trash"))[0]).toBeVisible();
    },
};
