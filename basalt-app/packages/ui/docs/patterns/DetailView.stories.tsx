import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { expect, screen, userEvent, within } from "storybook/test";
import { NoteColumn } from "../../.storybook/blocks";
import { Button } from "../../src/components/Button";
import { ErrorState } from "../../src/components/ErrorState";
import { IconButton } from "../../src/components/IconButton";
import { Menu } from "../../src/components/Menu";
import { SaveStatus } from "../../src/product/SaveStatus";

type Props = { state: "ready" | "not-found" | "no-access" };

function NoteDetail({ state }: Props) {
    if (state !== "ready") {
        return (
            <ErrorState
                title={
                    state === "not-found"
                        ? "This note no longer exists"
                        : "You cannot open this note"
                }
                description={
                    state === "not-found"
                        ? "It was deleted or moved outside Basalt. Your other notes are not affected."
                        : "Basalt does not have permission to read the file. Check the folder permissions and try again."
                }
                action={<Button variant="secondary">Back to notes</Button>}
            />
        );
    }

    return (
        <div className="flex w-full flex-col">
            <header className="flex items-center justify-between gap-between-groups border-b border-border-divider px-note-x py-panel">
                <div className="flex min-w-none flex-col gap-in-group">
                    <p className="truncate font-ui-strong text-size-ui text-text-ui">
                        Weekly plan
                    </p>
                    <p className="truncate text-size-ui-small text-text-muted">
                        Personal notes / Weekly plan.md
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-between-groups">
                    <SaveStatus state="saved" />
                    <Menu
                        align="end"
                        trigger={
                            <IconButton
                                aria-label="Note actions"
                                tooltip="Note actions"
                            >
                                <MoreHorizontal aria-hidden="true" />
                            </IconButton>
                        }
                        items={[
                            {
                                label: "Rename",
                                icon: <Pencil aria-hidden="true" />,
                                onSelect: () => {},
                            },
                            "separator",
                            {
                                label: "Delete note",
                                icon: <Trash2 aria-hidden="true" />,
                                onSelect: () => {},
                                destructive: true,
                            },
                        ]}
                    />
                </div>
            </header>
            <NoteColumn />
        </div>
    );
}

const meta = {
    title: "Patterns/Detail view",
    component: NoteDetail,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: { state: "ready" },
} satisfies Meta<typeof NoteDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("heading", { level: 1, name: "Weekly plan" }),
        ).toBeVisible();
        await userEvent.click(
            canvas.getByRole("button", { name: "Note actions" }),
        );
        await expect(
            await screen.findByRole("menuitem", { name: "Delete note" }),
        ).toBeVisible();
    },
};

export const NoteDoesNotExist: Story = {
    args: { state: "not-found" },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("alert"),
        ).toHaveTextContent("This note no longer exists");
    },
};

export const NoAccess: Story = { args: { state: "no-access" } };
