export const APP_ERROR_CODES = [
    "not-found",
    "permission-denied",
    "already-exists",
    "invalid-path",
    "not-a-file",
    "conflict",
    "too-large",
    "not-utf8",
    "unavailable",
    "unknown",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export type AppError = {
    [C in AppErrorCode]: { readonly code: C; readonly message: string };
}[AppErrorCode];

export type Result<T> =
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: AppError };

export function ok<T>(value: T): Result<T> {
    return { ok: true, value };
}

export function err<T = never>(error: AppError): Result<T> {
    return { ok: false, error };
}

export function mapError<T>(
    result: Result<T>,
    map: (error: AppError) => AppError,
): Result<T> {
    return result.ok ? result : err(map(result.error));
}
