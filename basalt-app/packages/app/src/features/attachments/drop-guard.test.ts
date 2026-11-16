import { afterEach, describe, expect, it } from "vitest";
import { installDropGuard } from "./drop-guard";

function dragEvent(type: string, types: string[]) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const dataTransfer = { types, dropEffect: "copy" };
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
    return { event: event as unknown as DragEvent, dataTransfer };
}

let remove: (() => void) | undefined;
afterEach(() => remove?.());

describe("installDropGuard", () => {
    it("cancels a file drop and refuses the drop effect for a file drag over the window", () => {
        remove = installDropGuard(window);
        const over = dragEvent("dragover", ["Files"]);
        const drop = dragEvent("drop", ["Files"]);

        document.body.dispatchEvent(over.event);
        document.body.dispatchEvent(drop.event);

        expect(over.event.defaultPrevented).toBe(true);
        expect(over.dataTransfer.dropEffect).toBe("none");
        expect(drop.event.defaultPrevented).toBe(true);
    });

    it("leaves non-file drags alone", () => {
        remove = installDropGuard(window);
        const text = dragEvent("drop", ["text/plain"]);

        document.body.dispatchEvent(text.event);

        expect(text.event.defaultPrevented).toBe(false);
    });

    it("does not touch a drag the editor already handled", () => {
        remove = installDropGuard(window);
        const over = dragEvent("dragover", ["Files"]);
        document.body.addEventListener(
            "dragover",
            (event) => event.preventDefault(),
            { once: true },
        );

        document.body.dispatchEvent(over.event);

        expect(over.dataTransfer.dropEffect).toBe("copy");
    });

    it("stops guarding after removal", () => {
        installDropGuard(window)();
        const drop = dragEvent("drop", ["Files"]);

        document.body.dispatchEvent(drop.event);

        expect(drop.event.defaultPrevented).toBe(false);
    });
});
