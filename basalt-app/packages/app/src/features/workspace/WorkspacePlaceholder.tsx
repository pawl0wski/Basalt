export type WorkspacePlaceholderProps = {
    title: string;
    folderName: string;
};

export function WorkspacePlaceholder({
    title,
    folderName,
}: WorkspacePlaceholderProps) {
    return (
        <div className="flex min-h-full flex-col items-start gap-in-group bg-surface-editor p-section text-text-ui">
            <h1 className="text-size-note-h1 text-text-note">{title}</h1>
            <p className="text-size-note text-text-ui">{folderName}</p>
        </div>
    );
}
