import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "./Button";
import { ErrorState } from "./ErrorState";

const meta = {
    title: "Primitives/ErrorState",
    component: ErrorState,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        title: "Could not open the workspace",
        description: "The folder is not available. Reconnect the drive or choose another folder.",
        action: <Button>Choose a workspace</Button>,
    },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("alert")).toHaveTextContent("Could not open the workspace");
        await expect(canvas.getByRole("button", { name: "Choose a workspace" })).toBeVisible();
    },
};

export const WithDetails: Story = {
    args: { details: "EACCES: permission denied, scandir '/mnt/notes'" },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    args: { details: "EACCES: permission denied, scandir '/mnt/notes/projects/2026'" },
};
