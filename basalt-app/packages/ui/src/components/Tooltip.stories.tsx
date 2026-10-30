import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "lucide-react";
import { expect, screen, userEvent, within } from "storybook/test";
import { IconButton } from "./IconButton";
import { Tooltip } from "./Tooltip";

const meta = {
    title: "Primitives/Tooltip",
    component: Tooltip,
    tags: ["!autodocs"],
    args: { content: "Open settings (Ctrl+,)", side: "top", children: <span /> },
    argTypes: { side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] } },
    render: (args) => (
        <div className="p-section">
            <Tooltip {...args}>
                <IconButton aria-label="Open settings" tooltip={false}>
                    <Settings aria-hidden="true" />
                </IconButton>
            </Tooltip>
        </div>
    ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole("button", { name: "Open settings" });
        await userEvent.hover(button);
        await expect(await screen.findByRole("tooltip")).toHaveTextContent("Open settings (Ctrl+,)");
        await userEvent.keyboard("{Escape}");
        await expect(screen.queryByRole("tooltip")).toBeNull();
    },
};

export const OnKeyboardFocus: Story = {
    play: async () => {
        await userEvent.tab();
        await expect(await screen.findByRole("tooltip")).toBeVisible();
    },
};

export const Bottom: Story = {
    args: { side: "bottom" },
    play: async () => {
        await userEvent.tab();
        await expect(await screen.findByRole("tooltip")).toBeVisible();
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    play: async () => {
        await userEvent.tab();
        await expect(await screen.findByRole("tooltip")).toBeVisible();
    },
};
