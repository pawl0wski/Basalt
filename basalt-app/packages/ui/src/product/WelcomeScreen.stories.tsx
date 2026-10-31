import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { WelcomeScreen } from "./WelcomeScreen";

const meta = {
    title: "Product/WelcomeScreen",
    component: WelcomeScreen,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: { onOpenWorkspace: fn() },
    decorators: [
        (Story) => (
            <div className="h-screen w-full bg-surface-editor">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WelcomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: "Open folder as workspace" }),
        );
        await expect(args.onOpenWorkspace).toHaveBeenCalledTimes(1);
        await expect(canvas.getAllByRole("button")).toHaveLength(1);
    },
};

export const WorkspaceLost: Story = {
    args: {
        notice: "The folder Personal notes is no longer available. Your notes were not changed. Open it again or choose another folder.",
    },
};
