import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { TextLink } from "./TextLink";

const variants = ["inline", "standalone"] as const;

const meta = {
    title: "Primitives/TextLink",
    component: TextLink,
    tags: ["!autodocs"],
    args: { href: "#settings", children: "Open settings" },
    argTypes: { variant: { control: "inline-radio", options: variants } },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(
            canvas.getByRole("link", { name: "Open settings" }),
        ).toHaveFocus();
    },
};

export const InText: Story = {
    render: (args) => (
        <p className="max-w-prose text-text-ui">
            Notes are plain Markdown files in your workspace folder. You can
            change the folder in{" "}
            <TextLink {...args} variant="inline">
                Settings
            </TextLink>
            .
        </p>
    ),
};

export const Standalone: Story = {
    args: { variant: "standalone", children: "Learn how notes are stored" },
};

export const States: Story = {
    parameters: { layout: "fullscreen" },
    render: (args) => (
        <StateMatrix
            columns={[...variants]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
            ]}
            cell={(column) => (
                <TextLink
                    {...args}
                    variant={column as (typeof variants)[number]}
                >
                    Open settings
                </TextLink>
            )}
        />
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: (args) => (
        <p className="p-panel text-text-ui">
            Markdown files and attachments stay in your folder.{" "}
            <TextLink {...args}>
                Learn how notes are stored on this device
            </TextLink>
        </p>
    ),
};
