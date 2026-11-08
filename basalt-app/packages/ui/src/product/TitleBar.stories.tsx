import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { TitleBar } from "./TitleBar";

const tabs = [
    { id: "weekly", name: "Weekly plan" },
    { id: "sync", name: "Sync server spec" },
    { id: "roadmap", name: "Roadmap" },
];

const windowControls = {
    onMinimize: fn(),
    onToggleMaximize: fn(),
    onClose: fn(),
};

const manyTabs = Array.from({ length: 14 }, (_, index) => ({
    id: `note-${index}`,
    name: `Daily note 2026-10-${String(index + 1).padStart(2, "0")}`,
}));

const tabCloseRule = { id: "aria-required-children", enabled: false };

const meta = {
    title: "Product/TitleBar",
    component: TitleBar,
    tags: ["!autodocs"],
    parameters: {
        layout: "fullscreen",
        a11y: { config: { rules: [tabCloseRule] } },
    },
    args: {
        tabs,
        activeTabId: "weekly",
        sidebarOpen: true,
        sidePanelOpen: true,
        windowControls,
        onSelectTab: fn(),
        onCloseTab: fn(),
        onNewNote: fn(),
        onToggleSidebar: fn(),
        onToggleSidePanel: fn(),
    },
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SelectableTitleBar(props: ComponentProps<typeof TitleBar>) {
    const [activeTabId, setActiveTabId] = useState(props.activeTabId);
    return (
        <TitleBar
            {...props}
            activeTabId={activeTabId}
            onSelectTab={(id) => {
                props.onSelectTab?.(id);
                setActiveTabId(id);
            }}
        />
    );
}

export const Playground: Story = {
    render: (args) => <SelectableTitleBar {...args} />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("tab", { name: "Weekly plan" }),
        ).toHaveAttribute("aria-selected", "true");
        await userEvent.click(canvas.getByRole("tab", { name: "Roadmap" }));
        await expect(args.onSelectTab).toHaveBeenCalledWith("roadmap");
        await expect(
            canvas.getByRole("tab", { name: "Roadmap" }),
        ).toHaveAttribute("aria-selected", "true");
        await userEvent.click(
            canvas.getByRole("button", { name: "Close Sync server spec" }),
        );
        await expect(args.onCloseTab).toHaveBeenCalledWith("sync");
    },
};

export const UnsavedNote: Story = {
    args: {
        tabs: [
            { id: "weekly", name: "Weekly plan", unsaved: true },
            { id: "sync", name: "Sync server spec" },
        ],
    },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("tab", {
                name: "Weekly plan not saved",
            }),
        ).toBeVisible();
    },
};

export const NoNoteOpen: Story = {
    args: { tabs: [], activeTabId: undefined, sidePanelOpen: false },
};

export const LongNoteName: Story = {
    args: {
        tabs: [
            {
                id: "long",
                name: "Quarterly planning notes for the whole product team including open questions",
            },
            { id: "weekly", name: "Weekly plan" },
        ],
        activeTabId: "long",
    },
};

export const TooManyNotes: Story = {
    args: { tabs: manyTabs, activeTabId: "note-12" },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            await canvas.findByRole("button", { name: "Show all open notes" }),
        );
        const item = await within(document.body).findByRole("menuitem", {
            name: "Daily note 2026-10-03",
        });
        await userEvent.click(item);
        await expect(args.onSelectTab).toHaveBeenCalledWith("note-2");
    },
};

export const WithoutWindowButtons: Story = {
    args: { windowControls: undefined },
};

export const WindowOnly: Story = {
    args: {
        tabs: undefined,
        onSelectTab: undefined,
        onCloseTab: undefined,
        onNewNote: undefined,
        onToggleSidebar: undefined,
        onToggleSidePanel: undefined,
    },
};

export const WindowMaximized: Story = {
    args: {
        tabs: undefined,
        windowControls: { ...windowControls, maximized: true },
    },
};

export const States: Story = {
    parameters: {
        layout: "fullscreen",
        a11y: {
            config: {
                rules: [
                    tabCloseRule,
                    { id: "landmark-unique", enabled: false },
                    { id: "landmark-no-duplicate-banner", enabled: false },
                ],
            },
        },
    },
    render: (args) => (
        <StateMatrix
            columns={["Inactive tab", "Open tab", "Unsaved tab"]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
            ]}
            cell={(column) => (
                <div className="w-sidebar">
                    <TitleBar
                        {...args}
                        windowControls={undefined}
                        tabs={[
                            {
                                id: "only",
                                name: "Weekly plan",
                                unsaved: column === "Unsaved tab",
                            },
                        ]}
                        activeTabId={
                            column === "Inactive tab" ? undefined : "only"
                        }
                    />
                </div>
            )}
        />
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
