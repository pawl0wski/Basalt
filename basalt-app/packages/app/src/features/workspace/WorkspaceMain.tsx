import { EmptyState } from "@basalt/ui";

export type WorkspaceMainProps = {
    title: string;
    description: string;
};

export function WorkspaceMain({ title, description }: WorkspaceMainProps) {
    return <EmptyState title={title} description={description} />;
}
