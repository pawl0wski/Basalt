import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SaveStatus } from "./SaveStatus";
import { StatusBar } from "./StatusBar";

const meta = {
    title: "Product/SaveStatus",
    component: SaveStatus,
    tags: ["!autodocs"],
    args: { state: "saved" },
    argTypes: {
        state: {
            control: "inline-radio",
            options: ["saved", "saving", "unsaved"],
        },
    },
} satisfies Meta<typeof SaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("status"),
        ).toHaveTextContent("Saved");
    },
};

export const AllStates: Story = {
    render: () => (
        <div className="flex flex-col gap-between-groups">
            <SaveStatus state="saved" />
            <SaveStatus state="saving" />
            <SaveStatus state="unsaved" />
        </div>
    ),
};

export const InStatusBar: Story = {
    parameters: { layout: "fullscreen" },
    render: () => (
        <StatusBar wordCount={1204} characterCount={7311} saveState="saving" />
    ),
};

export const StatusBarWithoutCounts: Story = {
    parameters: { layout: "fullscreen" },
    render: () => <StatusBar saveState="unsaved" />,
};
