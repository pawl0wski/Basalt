import type { ImageSource } from "@basalt/editor";
import type { TFunction } from "i18next";
import type { ImageLoadFailure, ImageLoadResult } from "./image-loader";

export type PlaceholderKey =
    | "missing"
    | "unreadable"
    | "unsupported"
    | "tooLarge"
    | "remote"
    | "invalid"
    | "unsupportedScheme";

export function placeholderKeyFor(reason: ImageLoadFailure): PlaceholderKey {
    switch (reason) {
        case "not-found":
            return "missing";
        case "unsupported":
            return "unsupported";
        case "too-large":
            return "tooLarge";
        case "remote":
            return "remote";
        case "invalid":
            return "invalid";
        case "unsupported-scheme":
            return "unsupportedScheme";
        case "invalid-path":
        case "permission-denied":
        case "already-exists":
        case "not-a-file":
        case "conflict":
        case "not-utf8":
        case "unavailable":
        case "unknown":
            return "unreadable";
        default: {
            const unreachable: never = reason;
            return unreachable;
        }
    }
}

export function toImageSource(
    result: ImageLoadResult,
    destination: string,
    t: TFunction,
): ImageSource {
    if (result.kind === "image") {
        return {
            kind: "image",
            src: result.src,
            width: result.dimensions?.width ?? null,
            height: result.dimensions?.height ?? null,
        };
    }
    return {
        kind: "placeholder",
        label: t(
            `attachments.placeholder.${placeholderKeyFor(result.reason)}`,
            {
                path: destination,
            },
        ),
    };
}
