import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Alert } from "./Alert";
import { Button } from "./Button";

const meta = {
    title: "Primitives/Alert",
    component: Alert,
    tags: ["!autodocs"],
    args: {
        variant: "info",
        children: "Markdown files and attachments stay in your folder.",
    },
    argTypes: {
        variant: {
            control: "inline-radio",
            options: ["info", "warning", "danger"],
        },
    },
    decorators: [
        (Story) => (
            <div className="w-full max-w-prose">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("status")).toBeVisible();
    },
};

export const Variants: Story = {
    render: () => (
        <div className="flex flex-col gap-between-groups">
            <Alert>Markdown files and attachments stay in your folder.</Alert>
            <Alert variant="warning" title="Sync conflict">
                Two devices changed this note. Review the changes to keep both.
            </Alert>
            <Alert variant="danger" title="Could not save the note">
                The folder is read-only. Choose a folder you can write to.
            </Alert>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole("status")).toHaveLength(2);
        await expect(canvas.getByRole("alert")).toHaveTextContent(
            "Could not save the note",
        );
    },
};

export const WithAction: Story = {
    args: {
        variant: "warning",
        title: "Sync conflict",
        children: "Two devices changed this note.",
    },
    render: (args) => (
        <Alert
            {...args}
            action={<Button variant="secondary">Review changes</Button>}
        />
    ),
};

export const LongText: Story = {
    args: {
        variant: "danger",
        title: "Could not read the workspace folder because it is on a drive that is no longer connected",
        children:
            "Reconnect the drive or choose another folder. Your notes are not deleted; Basalt only reads the files that are in the folder.",
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    args: {
        variant: "warning",
        title: "Sync conflict",
        children: "Two devices changed this note.",
    },
    render: (args) => (
        <div className="w-full p-panel">
            <Alert
                {...args}
                action={<Button variant="secondary">Review changes</Button>}
            />
        </div>
    ),
};

export const Dismissible: Story = {
    args: {
        variant: "info",
        children: "2 files were not added: this file format is not supported.",
    },
    render: (args) => (
        <Alert
            {...args}
            onDismiss={() => undefined}
            dismissLabel="Dismiss notice"
        />
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("button", {
                name: "Dismiss notice",
            }),
        ).toBeVisible();
    },
};
