import { FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "../../src/components/Alert";
import { Button } from "../../src/components/Button";
import { Card, CardRow } from "../../src/components/Card";
import { Checkbox } from "../../src/components/Checkbox";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { Field } from "../../src/components/Field";
import { IconButton } from "../../src/components/IconButton";
import { Input } from "../../src/components/Input";
import { RadioGroup } from "../../src/components/RadioGroup";
import { Select } from "../../src/components/Select";
import { Skeleton } from "../../src/components/Skeleton";
import { StatusIndicator } from "../../src/components/StatusIndicator";
import { Switch } from "../../src/components/Switch";
import { TextLink } from "../../src/components/TextLink";
import { ImagePlaceholder } from "../../src/product/ImagePlaceholder";
import { NoteBanner } from "../../src/product/NoteBanner";
import { NoteList } from "../../src/product/NoteList";
import { SaveStatus } from "../../src/product/SaveStatus";
import { sampleNotes } from "./sampleData";

export type CatalogEntry = {
    name: string;
    group: "Primitives" | "Product" | "Patterns";
    importName: string;
    summary: string;
    use: string;
    avoid: string;
    docs: string;
    preview?: ReactNode;
};

const noop = () => {};

export const catalog: CatalogEntry[] = [
    {
        name: "Button",
        group: "Primitives",
        importName: "Button",
        summary: "Starts an action the user has decided to take.",
        use: "Save note, Create new workspace, Cancel.",
        avoid: "Navigation (TextLink) or an icon-only control (IconButton).",
        docs: "primitives-button",
        preview: <Button>Save note</Button>,
    },
    {
        name: "IconButton",
        group: "Primitives",
        importName: "IconButton",
        summary:
            "A frequent, well-known action as an icon, named by aria-label.",
        use: "Toolbars, the title bar, list rows.",
        avoid: "Rare or unfamiliar actions (Button with text).",
        docs: "primitives-iconbutton",
        preview: (
            <IconButton aria-label="New note">
                <FilePlus aria-hidden="true" />
            </IconButton>
        ),
    },
    {
        name: "TextLink",
        group: "Primitives",
        importName: "TextLink",
        summary: "Takes the user to another place.",
        use: "A destination in a sentence or on its own line.",
        avoid: "Actions that change data (Button).",
        docs: "primitives-textlink",
        preview: <TextLink href="#settings">Open settings</TextLink>,
    },
    {
        name: "Input",
        group: "Primitives",
        importName: "Input",
        summary: "One line of free text.",
        use: "Names, titles, search text, always inside a Field.",
        avoid: "Fixed lists (Select) or many lines.",
        docs: "primitives-input",
        preview: <Input aria-label="Note name" defaultValue="Weekly plan" />,
    },
    {
        name: "Field and Label",
        group: "Primitives",
        importName: "Field, Label",
        summary: "Joins a label, a control, a hint and an error.",
        use: "Every form control that takes input.",
        avoid: "Checkbox and Switch (they carry their own label).",
        docs: "primitives-field",
        preview: (
            <Field label="Workspace name" hint="Shown in the window title.">
                <Input />
            </Field>
        ),
    },
    {
        name: "Checkbox",
        group: "Primitives",
        importName: "Checkbox",
        summary: "An option saved with a form.",
        use: "Settings applied by a button, independent options.",
        avoid: "Immediate on/off (Switch), one-of-many (RadioGroup).",
        docs: "primitives-checkbox",
        preview: <Checkbox label="Show word count" defaultChecked />,
    },
    {
        name: "Select",
        group: "Primitives",
        importName: "Select",
        summary: "One value from a short list.",
        use: "About 4 to 12 options, such as text size.",
        avoid: "Two or three options (RadioGroup).",
        docs: "primitives-select",
        preview: (
            <Select aria-label="Text size" defaultValue="system">
                <option value="system">System default</option>
            </Select>
        ),
    },
    {
        name: "Switch",
        group: "Primitives",
        importName: "Switch",
        summary: "Turns a setting on or off at once.",
        use: "Settings that apply immediately.",
        avoid: "Options saved later (Checkbox).",
        docs: "primitives-switch",
        preview: <Switch label="Sync notes" defaultChecked />,
    },
    {
        name: "RadioGroup",
        group: "Primitives",
        importName: "RadioGroup",
        summary: "Exactly one option from a few, all visible.",
        use: "Two to five exclusive options with descriptions.",
        avoid: "Long lists (Select), independent options (Checkbox).",
        docs: "primitives-radiogroup",
        preview: (
            <RadioGroup
                legend="Attachments"
                defaultValue="a"
                options={[
                    { value: "a", label: "Next to the note" },
                    { value: "b", label: "One shared folder" },
                ]}
            />
        ),
    },
    {
        name: "Card",
        group: "Primitives",
        importName: "Card, CardRow",
        summary: "Groups related settings under one heading.",
        use: "A group of two or more settings rows.",
        avoid: "A single control, a card inside a card.",
        docs: "primitives-card",
        preview: (
            <Card heading="Status bar">
                <CardRow title="Word count">
                    <Switch aria-label="Word count" defaultChecked />
                </CardRow>
            </Card>
        ),
    },
    {
        name: "StatusIndicator",
        group: "Primitives",
        importName: "StatusIndicator",
        summary: "Sync state in words.",
        use: "The status bar: Synced, Syncing, Sync conflict, Sync error.",
        avoid: "One-off results (Toast).",
        docs: "primitives-statusindicator",
        preview: <StatusIndicator status="synced" />,
    },
    {
        name: "Alert",
        group: "Primitives",
        importName: "Alert",
        summary: "A message that stays until the cause is gone.",
        use: "A conflict, a read-only folder, standing information.",
        avoid: "A field error (Field), a passing result (Toast).",
        docs: "primitives-alert",
        preview: (
            <Alert variant="warning" title="Sync conflict">
                Two devices changed this note.
            </Alert>
        ),
    },
    {
        name: "Skeleton",
        group: "Primitives",
        importName: "Skeleton",
        summary: "Holds the place of content that is loading.",
        use: "Images, lists, the note body when loading takes noticeable time.",
        avoid: "A failed load (ErrorState), nothing to show (EmptyState).",
        docs: "primitives-skeleton",
        preview: <Skeleton className="w-sidebar" />,
    },
    {
        name: "Tooltip",
        group: "Primitives",
        importName: "Tooltip",
        summary: "Names an icon or adds a shortcut on hover and focus.",
        use: "Icon-only controls, shortcut hints.",
        avoid: "Information the user needs to finish a task.",
        docs: "primitives-tooltip",
    },
    {
        name: "Dialog",
        group: "Primitives",
        importName: "Dialog",
        summary: "A short, focused task before returning to the note.",
        use: "Rename a note, choose a workspace.",
        avoid: "Yes/no questions (ConfirmDialog), long forms (a page).",
        docs: "primitives-dialog",
    },
    {
        name: "ConfirmDialog",
        group: "Primitives",
        importName: "ConfirmDialog",
        summary: "Confirms an action that is hard to undo.",
        use: "Deleting a note, discarding changes.",
        avoid: "Actions that can be undone with a Toast.",
        docs: "primitives-confirmdialog",
    },
    {
        name: "Menu",
        group: "Primitives",
        importName: "Menu",
        summary: "Several actions behind one button.",
        use: "Three or more actions on one object.",
        avoid: "One or two actions, navigation.",
        docs: "primitives-menu",
    },
    {
        name: "Popover",
        group: "Primitives",
        importName: "Popover",
        summary: "A small panel of controls next to its trigger.",
        use: "Accent color, sort order.",
        avoid: "A name for an icon (Tooltip), a long form.",
        docs: "primitives-popover",
    },
    {
        name: "Toast",
        group: "Primitives",
        importName: "ToastProvider, useToast",
        summary: "Confirms a short result and goes away.",
        use: "Note moved to trash, with Undo.",
        avoid: "Errors that need action (Alert).",
        docs: "primitives-toast",
    },
    {
        name: "Tabs",
        group: "Primitives",
        importName: "Tabs",
        summary: "Switches between sibling views on one screen.",
        use: "Settings sections.",
        avoid: "Pages with their own address, steps of a flow.",
        docs: "primitives-tabs",
    },
    {
        name: "EmptyState",
        group: "Primitives",
        importName: "EmptyState",
        summary: "Says why a place is empty and what to do next.",
        use: "An empty list, a search with no results.",
        avoid: "Loading (Skeleton), a failed load (ErrorState).",
        docs: "primitives-emptystate",
        preview: (
            <EmptyState
                headingAs="h3"
                title="No notes yet"
                action={<Button variant="secondary">New note</Button>}
            />
        ),
    },
    {
        name: "ErrorState",
        group: "Primitives",
        importName: "ErrorState",
        summary: "Replaces a view that could not be shown.",
        use: "A workspace that cannot be opened.",
        avoid: "A problem the rest of the view survives (Alert).",
        docs: "primitives-errorstate",
        preview: (
            <ErrorState
                title="Could not open the workspace"
                description="The folder is not available."
            />
        ),
    },
    {
        name: "NoteList",
        group: "Product",
        importName: "NoteList",
        summary: "The list of notes in the sidebar.",
        use: "The flat note list of a workspace (E01-S01).",
        avoid: "Choosing a value in a form.",
        docs: "product-notelist",
        preview: (
            <div className="w-sidebar">
                <NoteList
                    label="Notes"
                    notes={sampleNotes.slice(0, 3)}
                    selectedPath="Ideas.md"
                    onSelect={noop}
                />
            </div>
        ),
    },
    {
        name: "NoteSidebar",
        group: "Product",
        importName: "NoteSidebar",
        summary: "The left column of an open workspace.",
        use: "Workspace name, New note, Change workspace, the list.",
        avoid: "The welcome screen.",
        docs: "product-notesidebar",
    },
    {
        name: "SaveStatus and StatusBar",
        group: "Product",
        importName: "SaveStatus, StatusBar",
        summary: "Whether the note is saved, and the counts.",
        use: "The bottom bar while a note is open.",
        avoid: "Sync state between devices (StatusIndicator).",
        docs: "product-savestatus",
        preview: <SaveStatus state="saved" />,
    },
    {
        name: "NoteBanner",
        group: "Product",
        importName: "NoteBanner",
        summary: "Why the open note cannot save or open.",
        use: "Conflict, deleted file, read-only folder, too large, not UTF-8.",
        avoid: "Failures while leaving the note (SaveFailedDialog).",
        docs: "product-notebanner",
        preview: <NoteBanner kind="too-large" />,
    },
    {
        name: "SaveFailedDialog",
        group: "Product",
        importName: "SaveFailedDialog",
        summary: "Asks what to do with text that could not be saved.",
        use: "Leaving a note whose save failed.",
        avoid: "Failures while the user stays in the note (NoteBanner).",
        docs: "product-savefaileddialog",
    },
    {
        name: "NewNoteDialog",
        group: "Product",
        importName: "NewNoteDialog",
        summary: "Names a new note.",
        use: "Creating a note in the workspace root.",
        avoid: "Renaming (E01-S04).",
        docs: "product-newnotedialog",
    },
    {
        name: "ImagePlaceholder and NoteImage",
        group: "Product",
        importName: "ImagePlaceholder, NoteImage",
        summary: "Shows an image, or says why it cannot be shown.",
        use: "Below an image link in a note (E01-S03).",
        avoid: "Errors about the whole note.",
        docs: "product-imageplaceholder",
        preview: (
            <div className="w-sidebar">
                <ImagePlaceholder problem="unsupported" />
            </div>
        ),
    },
    {
        name: "WelcomeScreen",
        group: "Product",
        importName: "WelcomeScreen",
        summary: "The first screen: one action, open a folder.",
        use: "No workspace is open, or it is gone.",
        avoid: "An open but empty workspace.",
        docs: "product-welcomescreen",
    },
    {
        name: "Form",
        group: "Patterns",
        importName: "pattern",
        summary: "Collect, check, send and confirm without losing input.",
        use: "Any form (proposal).",
        avoid: "Validating while the user types the first time.",
        docs: "patterns-form",
    },
    {
        name: "List with filters",
        group: "Patterns",
        importName: "pattern",
        summary: "Narrow a long list, with a count and a way back.",
        use: "Long note lists (proposal).",
        avoid: "One message for both empty cases.",
        docs: "patterns-list-with-filters",
    },
    {
        name: "Detail view",
        group: "Patterns",
        importName: "pattern",
        summary: "One object with its main action and an honest missing state.",
        use: "The open note (proposal).",
        avoid: "Repeating the title as a second heading.",
        docs: "patterns-detail-view",
    },
    {
        name: "Delete confirmation",
        group: "Patterns",
        importName: "pattern",
        summary: "Ask once, then offer Undo.",
        use: "Deleting a note (proposal, E01-S04).",
        avoid: "Asking for actions that can be undone.",
        docs: "patterns-delete-confirmation",
    },
];
