import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SidePanel } from "./SidePanel";

const meta = {
    title: "Product/SidePanel",
    component: SidePanel,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        title: "Outline",
        onClose: fn(),
        onSearch: fn(),
        children: (
            <p className="p-panel text-size-ui-small text-text-muted">
                No headings found.
            </p>
        ),
    },
    decorators: [
        (Story) => (
            <div className="h-sidebar border-l border-border-divider">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: "Search Outline" }),
        );
        await userEvent.click(
            canvas.getByRole("button", { name: "Close Outline" }),
        );
        await expect(args.onSearch).toHaveBeenCalledTimes(1);
        await expect(args.onClose).toHaveBeenCalledTimes(1);
    },
};

export const WithoutSearch: Story = {
    args: { onSearch: undefined },
};

export const LongTitle: Story = {
    args: { title: "Headings of the note with a very long working title" },
};

export const LongContent: Story = {
    args: {
        children: (
            <ul className="m-none flex list-none flex-col p-panel text-size-ui text-text-ui">
                {Array.from({ length: 40 }, (_, index) => (
                    <li key={index} className="py-in-group">
                        Heading number {index + 1}
                    </li>
                ))}
            </ul>
        ),
    },
};
