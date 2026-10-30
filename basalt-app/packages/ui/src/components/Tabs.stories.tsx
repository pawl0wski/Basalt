import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Tabs } from "./Tabs";

const tabs = [
    { value: "general", label: "General", content: "Choose the workspace folder and the interface text size." },
    { value: "appearance", label: "Appearance", content: "Pick an accent color. Notes keep their own typography." },
    { value: "sync", label: "Sync", content: "See when notes were last synced with the other copy." },
];

const meta = {
    title: "Primitives/Tabs",
    component: Tabs,
    tags: ["!autodocs"],
    args: { label: "Settings sections", tabs, onValueChange: fn() },
    decorators: [(Story) => <div className="w-full max-w-prose"><Story /></div>],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(canvas.getByRole("tab", { name: "General" })).toHaveFocus();
        await userEvent.keyboard("{ArrowRight}");
        await expect(canvas.getByRole("tab", { name: "Appearance" })).toHaveFocus();
        await expect(canvas.getByRole("tab", { name: "Appearance" })).toHaveAttribute("aria-selected", "true");
        await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Pick an accent color");
        await userEvent.click(canvas.getByRole("tab", { name: "Sync" }));
        await expect(args.onValueChange).toHaveBeenLastCalledWith("sync");
    },
};

export const States: Story = {
    render: (args) => (
        <div className="flex flex-col gap-section">
            <div data-preview-state="focus"><Tabs {...args} label="Focus preview" /></div>
        </div>
    ),
};

export const ManyTabs: Story = {
    args: {
        tabs: [
            ...tabs,
            { value: "shortcuts", label: "Keyboard shortcuts", content: "Shortcuts." },
            { value: "advanced", label: "Advanced options for the workspace", content: "Advanced." },
        ],
    },
    globals: { viewport: { value: "mobile" } },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
