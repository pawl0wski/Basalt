import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { sampleNotes, workspaceName } from "../../.storybook/blocks";
import { NoteList } from "./NoteList";
import { NoteSidebar } from "./NoteSidebar";

const meta = {
    title: "Product/NoteSidebar",
    component: NoteSidebar,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        workspaceName,
        onChangeWorkspace: fn(),
        onNewNote: fn(),
        children: <NoteList label="Notes" notes={sampleNotes} selectedPath="Weekly plan.md" onSelect={() => {}} />,
    },
    decorators: [(Story) => <div className="h-sidebar w-sidebar"><Story /></div>],
} satisfies Meta<typeof NoteSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "New note" }));
        await userEvent.click(canvas.getByRole("button", { name: "Change workspace" }));
        await expect(args.onNewNote).toHaveBeenCalledTimes(1);
        await expect(args.onChangeWorkspace).toHaveBeenCalledTimes(1);
    },
};

export const FocusFallbackNotice: Story = {
    args: { notice: "The list refreshes when you return to this window." },
};

export const LongWorkspaceName: Story = {
    args: { workspaceName: "Notes for the whole family and the shared house, synced from the old laptop" },
};
