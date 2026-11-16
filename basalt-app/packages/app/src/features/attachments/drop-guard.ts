function isFileDrag(event: DragEvent): boolean {
    return event.dataTransfer?.types.includes("Files") === true;
}

export function installDropGuard(target: Window): () => void {
    const onDragOver = (event: DragEvent) => {
        if (!isFileDrag(event) || event.defaultPrevented) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };
    const onDrop = (event: DragEvent) => {
        if (!isFileDrag(event) || event.defaultPrevented) return;
        event.preventDefault();
    };
    target.addEventListener("dragover", onDragOver);
    target.addEventListener("drop", onDrop);
    return () => {
        target.removeEventListener("dragover", onDragOver);
        target.removeEventListener("drop", onDrop);
    };
}
