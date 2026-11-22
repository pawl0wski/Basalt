import type { AppError } from "@basalt/core";

export type ErrorSurface = "toast" | "persistent";

export function errorSurface(error: AppError): ErrorSurface {
    switch (error.detail?.kind) {
        case "move-collision":
        case "move-stopped":
        case "folder-move-stopped":
        case "delete-failed":
            return "toast";
        case "flush-failed":
        case undefined:
            break;
    }
    switch (error.code) {
        case "already-exists":
        case "not-found":
        case "invalid-path":
            return "toast";
        case "permission-denied":
        case "scope-denied":
        case "not-a-file":
        case "conflict":
        case "too-large":
        case "not-utf8":
        case "unsupported":
        case "unavailable":
        case "unknown":
            return "persistent";
    }
}
