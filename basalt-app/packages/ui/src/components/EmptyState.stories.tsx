import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus, SearchX } from "lucide-react";
import { expect, within } from "storybook/test";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

const meta = {
    title: "Primitives/EmptyState",
    component: EmptyState,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        title: "No notes yet",
        description: "Notes you create are saved as Markdown files in your workspace folder.",
        icon: <FilePlus aria-hidden="true" />,
        action: <Button>New note</Button>,
    },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("heading", { name: "No notes yet" })).toBeVisible();
        await expect(canvas.getByRole("button", { name: "New note" })).toBeVisible();
    },
};

export const NoResults: Story = {
    args: {
        title: "No notes match \"weekly\"",
        description: "Check the spelling or search in all folders.",
        icon: <SearchX aria-hidden="true" />,
        action: <Button variant="secondary">Clear search</Button>,
    },
};

export const WithoutAction: Story = {
    args: { action: undefined, icon: undefined },
};

export const LongText: Story = {
    args: {
        title: "There are no notes in this folder and no subfolders that contain notes either",
        description:
            "Create a note here or choose another folder. Files that are not Markdown are kept but not shown in the list of notes.",
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
