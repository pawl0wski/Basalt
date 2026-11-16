import { err, ok, type AppError, type Result } from "@basalt/core";

function errorText(error: unknown): string {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "";
}

const SCOPE_DENIED = /forbidden path|not allowed on the scope/i;
const NOT_FOUND =
    /no such file|not found|cannot find the (file|path)|os error (2|3)\b/i;
const PERMISSION_DENIED =
    /permission denied|access is denied|read-only|os error (1|5|13|30)\b/i;
const ALREADY_EXISTS =
    /already exists|file exists|the file exists|os error (17|80|183)\b/i;
const INVALID_PATH = /is a directory|not a directory|os error (20|21|267)\b/i;

export function mapPluginError(error: unknown): AppError {
    const text = errorText(error);
    if (SCOPE_DENIED.test(text)) {
        return {
            code: "scope-denied",
            message: "The app is not allowed to access this path.",
        };
    }
    if (NOT_FOUND.test(text)) {
        return {
            code: "not-found",
            message: "The file or folder was not found.",
        };
    }
    if (PERMISSION_DENIED.test(text)) {
        return {
            code: "permission-denied",
            message: "Access to the file or folder was denied.",
        };
    }
    if (ALREADY_EXISTS.test(text)) {
        return { code: "already-exists", message: "The entry already exists." };
    }
    if (INVALID_PATH.test(text)) {
        return {
            code: "invalid-path",
            message: "The path does not point to the expected kind of entry.",
        };
    }
    return { code: "unknown", message: "The file operation failed." };
}

export async function attempt<T>(
    operation: () => Promise<T>,
): Promise<Result<T>> {
    try {
        return ok(await operation());
    } catch (error) {
        return err(mapPluginError(error));
    }
}
