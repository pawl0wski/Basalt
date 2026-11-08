export function StartupScreen({ label }: { label: string }) {
    return (
        <div
            aria-busy="true"
            aria-label={label}
            className="h-full bg-surface-editor"
            role="status"
        />
    );
}
