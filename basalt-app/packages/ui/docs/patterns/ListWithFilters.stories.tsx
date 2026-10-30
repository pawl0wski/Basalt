import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { manyNotes, sampleNotes } from "../../.storybook/blocks";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { Field } from "../../src/components/Field";
import { Input } from "../../src/components/Input";
import type { NoteListEntry } from "../../src/product/NoteList";
import { NoteList } from "../../src/product/NoteList";

type Props = {
    notes: NoteListEntry[];
    initialFilter?: string;
    loading?: boolean;
};

function FilterableNotes({ notes, initialFilter = "", loading = false }: Props) {
    const [filter, setFilter] = useState(initialFilter);
    const [selected, setSelected] = useState<string | null>(null);
    const query = filter.trim().toLowerCase();
    const visible = notes.filter((note) => note.path.toLowerCase().includes(query));
    const filtered = query !== "";

    const empty = filtered ? (
        <EmptyState
            headingAs="h3"
            title={`No notes match "${filter.trim()}"`}
            description="Check the spelling, or clear the filter to see all notes."
            action={<Button variant="secondary" onClick={() => setFilter("")}>Clear filter</Button>}
        />
    ) : (
        <EmptyState
            headingAs="h3"
            title="Create your first note"
            description="Notes are saved as Markdown files in this folder."
            action={<Button variant="secondary"><FilePlus aria-hidden="true" />New note</Button>}
        />
    );

    return (
        <div className="flex w-sidebar flex-col gap-between-groups bg-surface-card py-panel">
            <div className="flex flex-col gap-in-group px-panel">
                <Field label="Filter notes">
                    <Input value={filter} onChange={(event) => setFilter(event.target.value)} type="search" />
                </Field>
                {!loading && notes.length > 0 ? (
                    <div className="flex items-center justify-between gap-between-groups text-size-ui-small text-text-muted">
                        <p role="status">
                            {filtered ? `Showing ${visible.length} of ${notes.length} notes` : `${notes.length} notes`}
                        </p>
                        {filtered ? (
                            <Button variant="ghost" onClick={() => setFilter("")}>
                                Clear filter
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
            <NoteList
                label="Notes"
                notes={visible}
                selectedPath={selected}
                onSelect={setSelected}
                status={loading ? "loading" : "ready"}
                empty={empty}
            />
        </div>
    );
}

const meta = {
    title: "Patterns/List with filters",
    component: FilterableNotes,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: { notes: sampleNotes },
} satisfies Meta<typeof FilterableNotes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unfiltered: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("status")).toHaveTextContent("7 notes");
    },
};

export const FilteringShowsTheCountAndAWayBack: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText("Filter notes"), "plan");
        await expect(canvas.getByRole("status")).toHaveTextContent("Showing 1 of 7 notes");
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
        await userEvent.click(canvas.getAllByRole("button", { name: "Clear filter" })[0]);
        await expect(canvas.getAllByRole("option")).toHaveLength(7);
    },
};

export const NoResultsForTheFilter: Story = {
    args: { initialFilter: "budget" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("heading", { name: 'No notes match "budget"' })).toBeVisible();
        await userEvent.click(canvas.getAllByRole("button", { name: "Clear filter" })[1]);
        await expect(canvas.getAllByRole("option")).toHaveLength(7);
    },
};

export const NothingHereYet: Story = {
    args: { notes: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("heading", { name: "Create your first note" })).toBeVisible();
        await expect(canvas.queryByText(/Showing/)).toBeNull();
    },
};

export const Loading: Story = { args: { loading: true } };

export const ManyNotes: Story = { args: { notes: manyNotes(400), initialFilter: "2026-03" } };
