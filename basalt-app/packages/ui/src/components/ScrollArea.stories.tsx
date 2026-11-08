import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ScrollArea } from "./ScrollArea";

const lines = Array.from({ length: 30 }, (_, index) => `Note ${index + 1}`);

const meta = {
    title: "Primitives/ScrollArea",
    component: ScrollArea,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        label: "Notes",
        className:
            "h-sidebar w-sidebar max-w-full rounded-container border border-border-divider bg-surface-card",
        children: (
            <ul className="m-none flex list-none flex-col gap-in-group p-panel text-size-ui text-text-ui">
                {lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        ),
    },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("region", { name: "Notes" }),
        ).toBeVisible();
        await expect(canvas.getByText("Note 1")).toBeVisible();
    },
};

export const LongContent: Story = {
    args: {
        children: (
            <p className="w-prose p-panel text-size-ui text-text-ui">
                {lines.join(", ")}
            </p>
        ),
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
