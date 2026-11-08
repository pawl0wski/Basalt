import type { AppErrorCode } from "@basalt/core";
import type { TFunction } from "i18next";

export function openErrorMessage(t: TFunction, code: AppErrorCode): string {
    switch (code) {
        case "invalid-path":
            return t("notes.openError.symlink");
        case "unknown":
            return t("notes.openError.unknown");
        case "too-large":
            return t("notes.openError.too-large");
        case "not-utf8":
            return t("notes.openError.not-utf8");
        default:
            return t(`errors.${code}`);
    }
}
