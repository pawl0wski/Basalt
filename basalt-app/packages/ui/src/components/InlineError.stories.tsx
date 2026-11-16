import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { InlineError } from "./InlineError";

const meta = {
    title: "Primitives/InlineError",
    component: InlineError,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        children: "The workspace folder is read-only. Nothing was changed.",
    },
} satisfies Meta<typeof InlineError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("alert")).toBeVisible();
    },
};

export const LongMessage: Story = {
    decorators: [
        (Story) => (
            <div className="w-sidebar">
                <Story />
            </div>
        ),
    ],
    args: {
        children:
            "Could not rename the note because the file system refused the change. Check the folder permissions and try again.",
    },
};
