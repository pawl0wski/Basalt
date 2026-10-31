import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Skeleton } from "./Skeleton";

const meta = {
    title: "Primitives/Skeleton",
    component: Skeleton,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    decorators: [
        (Story) => (
            <div className="w-full max-w-prose">
                <Story />
            </div>
        ),
    ],
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).queryByRole("img")).toBeNull();
        await expect(
            canvasElement.querySelector("[aria-hidden='true']"),
        ).not.toBeNull();
    },
};

export const NoteLoading: Story = {
    render: () => (
        <div
            role="status"
            aria-busy="true"
            className="flex w-full max-w-prose flex-col gap-between-groups"
        >
            <span className="sr-only">Loading note</span>
            <Skeleton className="h-activity-button w-activity-bar" />
            <Skeleton />
            <Skeleton />
            <Skeleton className="w-sidebar max-w-full" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("status"),
        ).toHaveTextContent("Loading note");
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: () => (
        <div
            role="status"
            aria-busy="true"
            className="flex w-full flex-col gap-between-groups p-panel"
        >
            <span className="sr-only">Loading image</span>
            <Skeleton className="h-sidebar w-full" />
            <Skeleton className="w-sidebar max-w-full" />
        </div>
    ),
};
