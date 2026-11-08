import type { AutosaveStatus } from "@basalt/core";
import type { SaveState } from "@basalt/ui";

export function toSaveState(status: AutosaveStatus): SaveState {
    switch (status) {
        case "saved":
            return "saved";
        case "saving":
            return "saving";
        case "pending":
        case "paused":
            return "unsaved";
    }
}
