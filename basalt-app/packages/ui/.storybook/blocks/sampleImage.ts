export function sampleImage(width = 1600, height = 900): string {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return "";

    const token = (name: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    context.fillStyle = token("--bs-surface-frame");
    context.fillRect(0, 0, width, height);
    context.fillStyle = token("--bs-surface-raised");
    context.fillRect(width * 0.06, height * 0.1, width * 0.88, height * 0.8);
    context.fillStyle = token("--bs-state-selected");
    context.fillRect(width * 0.06, height * 0.1, width * 0.88, height * 0.08);
    context.fillStyle = token("--bs-border-control");
    for (let row = 0; row < 6; row += 1) {
        context.fillRect(width * 0.1, height * (0.26 + row * 0.1), width * (0.3 + ((row * 7) % 5) * 0.1), height * 0.03);
    }
    context.fillStyle = token("--bs-action-primary");
    context.fillRect(width * 0.62, height * 0.5, width * 0.28, height * 0.3);
    return canvas.toDataURL("image/png");
}
