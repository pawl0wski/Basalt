import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { NoteBanner } from "./NoteBanner";

const meta: Meta = {
    title: "Product/NoteBanner",
    component: NoteBanner,
    tags: ["!autodocs"],
    decorators: [
        (Story) => (
            <div className="w-full max-w-note">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj;

const onKeepMine = fn();
const onLoadFromDisk = fn();
const onSaveAgain = fn();
const onCloseNote = fn();
const onRetry = fn();

export const Conflict: Story = {
    render: () => (
        <NoteBanner
            kind="conflict"
            onKeepMine={onKeepMine}
            onLoadFromDisk={onLoadFromDisk}
        />
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", {
                name: "Keep my version",
            }),
        );
        await expect(onKeepMine).toHaveBeenCalledTimes(1);
        await expect(onLoadFromDisk).not.toHaveBeenCalled();
    },
};

export const Deleted: Story = {
    render: () => (
        <NoteBanner
            kind="deleted"
            onSaveAgain={onSaveAgain}
            onCloseNote={onCloseNote}
        />
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Close note" }),
        );
        await expect(onCloseNote).toHaveBeenCalledTimes(1);
        await expect(onSaveAgain).not.toHaveBeenCalled();
    },
};

export const PermissionDenied: Story = {
    render: () => <NoteBanner kind="permission-denied" onRetry={onRetry} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("alert")).toHaveTextContent(
            "Could not save the note",
        );
        await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
        await expect(onRetry).toHaveBeenCalledTimes(1);
    },
};

export const TooLarge: Story = {
    render: () => <NoteBanner kind="too-large" />,
};

export const NotUtf8: Story = { render: () => <NoteBanner kind="not-utf8" /> };
