import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo } from "react";
import { expect, within } from "storybook/test";
import { sampleImage } from "../../.storybook/blocks";
import { ImagePlaceholder, NoteImage } from "./ImagePlaceholder";

const meta = {
    title: "Product/ImagePlaceholder",
    component: ImagePlaceholder,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: { problem: "not-found", path: "attachments/Pasted image 20261025-101530.png" },
    argTypes: {
        problem: {
            control: "select",
            options: ["loading", "not-found", "unreadable", "unsupported", "too-large", "remote", "invalid"],
        },
    },
    decorators: [(Story) => <div className="w-full max-w-note"><Story /></div>],
} satisfies Meta<typeof ImagePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText(/Image not found: attachments\//)).toBeVisible();
    },
};

export const AllProblems: Story = {
    render: () => (
        <div className="flex flex-col gap-between-groups">
            <ImagePlaceholder problem="loading" />
            <ImagePlaceholder problem="not-found" path="attachments/diagram.png" />
            <ImagePlaceholder problem="unreadable" />
            <ImagePlaceholder problem="unsupported" />
            <ImagePlaceholder problem="too-large" />
            <ImagePlaceholder problem="remote" />
            <ImagePlaceholder problem="invalid" />
        </div>
    ),
};

export const LongPath: Story = {
    args: {
        path: "attachments/screenshots/2026/10/Pasted image of the whole settings window with the sync section open 20261025-101530.png",
    },
};

function Loaded() {
    const source = useMemo(() => sampleImage(1600, 900), []);
    return <NoteImage src={source} alt="Whiteboard photo" width={1600} height={900} />;
}

export const LoadedImage: Story = {
    render: () => <Loaded />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("img", { name: "Whiteboard photo" })).toBeVisible();
    },
};
