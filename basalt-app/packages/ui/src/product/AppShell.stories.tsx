import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { AppShell } from "./AppShell";

const region = (label: string) => (
    <div className="flex h-full items-center justify-center p-panel text-text-muted">
        {label}
    </div>
);

const meta = {
    title: "Product/AppShell",
    component: AppShell,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        titleBar: (
            <div className="h-titlebar bg-surface-frame p-panel text-text-muted">
                Title bar
            </div>
        ),
        activityBar: (
            <div className="h-full w-activity-bar bg-surface-frame p-in-group text-size-ui-small text-text-muted">
                Bar
            </div>
        ),
        sidebar: (
            <div className="h-full w-sidebar bg-surface-card">
                {region("Left panel")}
            </div>
        ),
        sidePanel: (
            <div className="h-full w-sidebar bg-surface-card">
                {region("Right panel")}
            </div>
        ),
        statusBar: (
            <div className="flex h-status-bar items-center bg-surface-frame px-between-groups text-size-ui-small text-text-muted">
                Status bar
            </div>
        ),
        children: region("Editor"),
    },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllRegions: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("main")).toHaveTextContent(
            "Editor",
        );
    },
};

export const WithoutRightPanel: Story = {
    args: { sidePanel: undefined },
};

export const WithoutSidebar: Story = {
    args: { sidebar: undefined, sidePanel: undefined },
};
