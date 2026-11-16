import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent } from "storybook/test";
import { NewFolderDialog } from "./NewFolderDialog";
import { RenameDialog } from "./RenameDialog";

const meta = {
    title: "Product/Name dialogs",
    component: RenameDialog,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        open: true,
        onOpenChange: fn(),
        title: "Rename note",
        description: "The file is renamed in its folder.",
        nameLabel: "Note name",
        submitLabel: "Rename",
        pendingLabel: "Renaming…",
        cancelLabel: "Cancel",
        currentName: "Weekly plan",
        name: "Weekly plan",
        onNameChange: fn(),
        onSubmit: fn(),
    },
} satisfies Meta<typeof RenameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: React.ComponentProps<typeof RenameDialog>) {
    const [name, setName] = useState(props.name);
    return <RenameDialog {...props} name={name} onNameChange={setName} />;
}

function ControlledFolder(props: React.ComponentProps<typeof NewFolderDialog>) {
    const [name, setName] = useState(props.name);
    return <NewFolderDialog {...props} name={name} onNameChange={setName} />;
}

export const Rename: Story = {
    render: (args) => <Controlled {...args} />,
    play: async ({ args }) => {
        const input = await screen.findByRole("textbox", { name: "Note name" });
        await expect(input).toHaveFocus();
        await userEvent.keyboard("Roadmap{Enter}");
        await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    },
};

export const RenameNameTaken: Story = {
    args: {
        name: "Ideas",
        error: "A note named Ideas already exists. Choose another name.",
    },
    play: async ({ args }) => {
        await expect(
            await screen.findByRole("button", { name: "Rename" }),
        ).toBeDisabled();
        await userEvent.keyboard("{Enter}");
        await expect(args.onSubmit).not.toHaveBeenCalled();
    },
};

export const RenameReadOnlyWorkspace: Story = {
    args: {
        name: "Roadmap",
        operationError:
            "The workspace folder is read-only. The note was not renamed.",
    },
    play: async () => {
        await expect(await screen.findByRole("alert")).toHaveTextContent(
            "read-only",
        );
        await expect(
            screen.getByRole("button", { name: "Rename" }),
        ).toBeEnabled();
    },
};

export const Renaming: Story = { args: { name: "Roadmap", pending: true } };

export const NewFolder: Story = {
    render: (args) => (
        <ControlledFolder
            {...args}
            title="New folder"
            description="The folder is created in the workspace."
            nameLabel="Folder name"
            submitLabel="Create folder"
            pendingLabel="Creating…"
            name=""
        />
    ),
    play: async ({ args }) => {
        const input = await screen.findByRole("textbox", {
            name: "Folder name",
        });
        await expect(input).toHaveValue("");
        await expect(
            screen.getByRole("button", { name: "Create folder" }),
        ).toBeDisabled();
        await userEvent.type(input, "Archive{Enter}");
        await expect(args.onSubmit).toHaveBeenCalled();
    },
};

export const NewFolderCreateFails: Story = {
    render: (args) => (
        <ControlledFolder
            {...args}
            title="New folder"
            nameLabel="Folder name"
            submitLabel="Create folder"
            pendingLabel="Creating…"
            name="Archive"
            operationError="The folder could not be created. Check the folder permissions."
        />
    ),
};
