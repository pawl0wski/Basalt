import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { Popover } from "./Popover";
import { RadioGroup } from "./RadioGroup";

const meta = {
    title: "Primitives/Popover",
    component: Popover,
    tags: ["!autodocs"],
    argTypes: {
        trigger: { control: false, table: { disable: true } },
        children: { control: false, table: { disable: true } },
    },
    parameters: { layout: "padded" },
    args: {
        label: "Accent color",
        trigger: <Button variant="secondary">Accent color</Button>,
        children: (
            <RadioGroup
                legend="Accent color"
                defaultValue="blue"
                options={[
                    { value: "blue", label: "Blue" },
                    { value: "green", label: "Green" },
                    { value: "amber", label: "Amber" },
                ]}
            />
        ),
    },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole("button", {
            name: "Accent color",
        });
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await userEvent.click(trigger);
        await expect(
            await screen.findByRole("dialog", { name: "Accent color" }),
        ).toBeVisible();
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        await userEvent.keyboard("{Escape}");
        await expect(screen.queryByRole("dialog")).toBeNull();
        await expect(trigger).toHaveFocus();
    },
};

export const Open: Story = { args: { defaultOpen: true } };

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    args: { defaultOpen: true },
};
