import type { AppError } from "@basalt/core";
import type { TFunction } from "i18next";

export function describeOperationError(t: TFunction, error: AppError): string {
    const { detail } = error;
    if (detail?.kind === "move-collision") {
        return t("tree.move.collision", { name: detail.name });
    }
    if (detail?.kind === "move-stopped") {
        return t(
            detail.linksOnly
                ? "tree.move.linksNotUpdated"
                : "tree.move.stopped",
            {
                name: detail.name,
                moved: detail.moved,
                total: detail.total,
                reason: t(`errors.${error.code}`),
            },
        );
    }
    if (detail?.kind === "delete-failed") {
        return t("tree.delete.partial", {
            failed: detail.failed,
            total: detail.total,
        });
    }
    return t(`errors.${error.code}`);
}
