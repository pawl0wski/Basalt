import type { Meta, StoryObj } from "@storybook/react-vite";
import {
    ColorRoles,
    ContrastTable,
    IconSizes,
    LayoutWidths,
    MotionDemo,
    ShapeDepth,
    SpacingRelations,
    TypeRoles,
} from "../../.storybook/blocks";

const meta = {
    title: "Foundations/Checks",
    parameters: { layout: "fullscreen", docs: { disable: true } },
    tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Color: Story = { render: () => <ColorRoles /> };
export const ContrastText: Story = { render: () => <ContrastTable kind="text" /> };
export const ContrastInterface: Story = { render: () => <ContrastTable kind="ui" /> };
export const Typography: Story = { render: () => <TypeRoles /> };
export const Spacing: Story = { render: () => <SpacingRelations /> };
export const Layout: Story = { render: () => <LayoutWidths /> };
export const Shape: Story = { render: () => <ShapeDepth /> };
export const Motion: Story = { render: () => <MotionDemo /> };
export const Icons: Story = { render: () => <IconSizes /> };
