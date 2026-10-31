import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { longNameNote, manyNotes, sampleNotes } from "../../.storybook/blocks";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { NoteList } from "./NoteList";

const meta = {
    title: "Product/NoteList",
    component: NoteList,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        label: "Notes",
        notes: sampleNotes,
        selectedPath: "Weekly plan.md",
        onSelect: fn(),
    },
    decorators: [
        (Story) => (
            <div className="w-sidebar bg-surface-card">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof NoteList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: React.ComponentProps<typeof NoteList>) {
    const [selected, setSelected] = useState(props.selectedPath);
    return (
        <NoteList
            {...props}
            selectedPath={selected}
            onSelect={(path) => {
                setSelected(path);
                props.onSelect(path);
            }}
        />
    );
}

export const Playground: Story = {
    render: (args) => <Controlled {...args} selectedPath="Ideas.md" />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(
            canvas.getByRole("option", { name: "Ideas" }),
        ).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}{ArrowDown}");
        await userEvent.keyboard("{Enter}");
        await expect(args.onSelect).toHaveBeenCalledWith("projects/Roadmap.md");
        await expect(
            canvas.getByRole("option", { name: "projects/ Roadmap" }),
        ).toHaveAttribute("aria-selected", "true");
    },
};

const afterTransition = () =>
    new Promise((resolve) => setTimeout(resolve, 250));

function tokenColor(token: string): string {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${token})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
}

export const SelectedRowFollowsFocus: Story = {
    render: (args) => (
        <div>
            <Controlled {...args} selectedPath="Ideas.md" />
            <button type="button" className="mt-between-groups text-text-ui">
                Outside the list
            </button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const row = canvas.getByRole("option", { name: "Ideas" });
        await expect(getComputedStyle(row).backgroundColor).toBe(
            tokenColor("--bs-state-selected"),
        );
        await userEvent.tab();
        await expect(row).toHaveFocus();
        await afterTransition();
        await expect(getComputedStyle(row).backgroundColor).toBe(
            tokenColor("--bs-tree-selected"),
        );
        await expect(getComputedStyle(row).borderRadius).toBe("4px");
        await userEvent.tab();
        await expect(
            canvas.getByRole("button", { name: "Outside the list" }),
        ).toHaveFocus();
        await afterTransition();
        await expect(getComputedStyle(row).backgroundColor).toBe(
            tokenColor("--bs-state-selected"),
        );
    },
};

export const Loading: Story = { args: { status: "loading" } };

export const Empty: Story = {
    args: {
        notes: [],
        empty: (
            <EmptyState
                headingAs="h3"
                title="Create your first note"
                description="Notes are saved as Markdown files in this folder."
                action={
                    <Button variant="secondary">
                        <FilePlus aria-hidden="true" />
                        New note
                    </Button>
                }
            />
        ),
    },
};

export const ErrorOnRead: Story = {
    args: {
        status: "error",
        error: (
            <ErrorState
                title="Could not read the folder"
                description="Check that it still exists and that you can read it."
                action={<Button variant="secondary">Try again</Button>}
            />
        ),
    },
};

export const ManyNotes: Story = {
    args: { notes: manyNotes(400), selectedPath: null },
    decorators: [
        (Story) => (
            <div className="h-sidebar w-sidebar overflow-y-auto bg-surface-card">
                <Story />
            </div>
        ),
    ],
};

export const LongName: Story = {
    args: {
        notes: [...sampleNotes.slice(0, 3), longNameNote],
        selectedPath: longNameNote.path,
    },
};

export const NothingSelected: Story = { args: { selectedPath: null } };
