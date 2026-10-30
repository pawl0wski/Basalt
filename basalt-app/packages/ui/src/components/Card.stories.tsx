import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card, CardRow } from "./Card";
import { Select } from "./Select";
import { Switch } from "./Switch";

const meta = {
    title: "Primitives/Card",
    component: Card,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: { heading: "Status bar", children: null },
    render: (args) => (
        <div className="w-full max-w-prose">
            <Card {...args}>
                <CardRow title="Word and character count" description="Shown at the right of the status bar.">
                    <Switch aria-label="Word and character count" defaultChecked />
                </CardRow>
                <CardRow title="Sync status" description="Shows Synced, Syncing or an error in words.">
                    <Switch aria-label="Sync status" defaultChecked />
                </CardRow>
            </Card>
        </div>
    ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("region", { name: "Status bar" })).toBeVisible();
        await expect(canvas.getAllByRole("switch")).toHaveLength(2);
    },
};

export const WithSelect: Story = {
    args: { heading: "Appearance" },
    render: (args) => (
        <div className="w-full max-w-prose">
            <Card {...args}>
                <CardRow title="Interface text size" description="Menus and settings. Notes keep their own size.">
                    <Select aria-label="Interface text size">
                        <option>System default</option>
                        <option>Small</option>
                        <option>Large</option>
                    </Select>
                </CardRow>
            </Card>
        </div>
    ),
};

export const LongText: Story = {
    render: (args) => (
        <div className="w-full max-w-prose">
            <Card {...args}>
                <CardRow
                    title="Store attachments next to the note that uses them instead of one shared folder for the whole workspace"
                    description="Moving a note in the file explorer moves its images too. Existing notes are not changed until you save them again."
                >
                    <Switch aria-label="Store attachments next to notes" />
                </CardRow>
            </Card>
        </div>
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
