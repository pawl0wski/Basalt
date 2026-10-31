import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { StatusIndicator } from "./StatusIndicator";

const meta = {
    title: "Primitives/StatusIndicator",
    component: StatusIndicator,
    tags: ["!autodocs"],
    args: { status: "synced" },
    argTypes: {
        status: {
            control: "inline-radio",
            options: ["synced", "syncing", "conflict", "error"],
        },
    },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("status"),
        ).toHaveTextContent("Synced");
    },
};

export const AllStatuses: Story = {
    render: () => (
        <div className="flex flex-col gap-between-groups">
            <StatusIndicator status="synced" />
            <StatusIndicator status="syncing" />
            <StatusIndicator status="conflict" />
            <StatusIndicator status="error" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const statuses = within(canvasElement).getAllByRole("status");
        await expect(statuses.map((item) => item.textContent)).toEqual([
            "Synced",
            "Syncing",
            "Sync conflict",
            "Sync error",
        ]);
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: () => (
        <div className="flex h-status-bar w-full items-center justify-between bg-surface-frame px-between-groups">
            <span className="text-size-ui-small text-text-muted">
                1,204 words
            </span>
            <StatusIndicator status="error" />
        </div>
    ),
};
