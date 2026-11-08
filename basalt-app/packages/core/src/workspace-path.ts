import { err, ok, type Result } from "./result";

export type WorkspacePath = string & { readonly __brand: "WorkspacePath" };

export const NOTE_NAME_ISSUES = [
    "empty",
    "traversal",
    "separator",
    "invalid-character",
    "reserved-name",
    "trailing-dot-or-space",
    "too-long",
] as const;

export type NoteNameIssue = (typeof NOTE_NAME_ISSUES)[number];

export type NoteNameValidation =
    | { readonly valid: true }
    | { readonly valid: false; readonly reason: NoteNameIssue };

const MAX_NAME_BYTES = 255;
const CONTROL_CHARACTERS = /\p{Cc}/u;
const DRIVE_PREFIX = /^[A-Za-z]:/;
const FORBIDDEN_NAME_CHARACTERS = /[:*?"<>|]/;
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function invalidPath(message: string): Result<never> {
    return err({ code: "invalid-path", message });
}

export function toWorkspacePath(input: string): Result<WorkspacePath> {
    if (input === "") return invalidPath("path is empty");
    if (CONTROL_CHARACTERS.test(input)) {
        return invalidPath("path contains a control character");
    }
    if (input.includes("\\")) return invalidPath("path contains a backslash");
    if (DRIVE_PREFIX.test(input)) return invalidPath("path has a drive letter");
    for (const segment of input.split("/")) {
        if (segment === "") {
            return invalidPath("path is absolute or has an empty segment");
        }
        if (segment === "." || segment === "..") {
            return invalidPath("path has a relative segment");
        }
    }
    return ok(input as WorkspacePath);
}

export function pathKey(path: WorkspacePath): string {
    return path.toLowerCase().normalize("NFC");
}

export function validateNoteName(name: string): NoteNameValidation {
    const reason = findNoteNameIssue(name);
    return reason === null ? { valid: true } : { valid: false, reason };
}

function findNoteNameIssue(name: string): NoteNameIssue | null {
    if (name === "") return "empty";
    if (name === "." || name === "..") return "traversal";
    if (name.includes("/") || name.includes("\\")) return "separator";
    if (FORBIDDEN_NAME_CHARACTERS.test(name) || CONTROL_CHARACTERS.test(name)) {
        return "invalid-character";
    }
    if (name.endsWith(".") || name.endsWith(" ")) {
        return "trailing-dot-or-space";
    }
    if (RESERVED_WINDOWS_NAMES.test(name.split(".")[0] ?? "")) {
        return "reserved-name";
    }
    if (new TextEncoder().encode(name).length > MAX_NAME_BYTES) {
        return "too-long";
    }
    return null;
}
