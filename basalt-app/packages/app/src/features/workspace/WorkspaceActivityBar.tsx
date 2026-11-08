import { ActivityBar } from "@basalt/ui";
import { Files } from "lucide-react";

export type WorkspaceActivityBarProps = {
    notesLabel: string;
};

export function WorkspaceActivityBar({
    notesLabel,
}: WorkspaceActivityBarProps) {
    return (
        <ActivityBar
            items={[
                {
                    id: "notes",
                    label: notesLabel,
                    icon: <Files aria-hidden="true" />,
                },
            ]}
            activeId="notes"
            onSelect={() => {}}
        />
    );
}
