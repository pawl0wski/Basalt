import type { AppErrorCode } from "@basalt/core";
import type { TFunction } from "i18next";
import type { AddImagesOutcome } from "./add-images";

export type AddNotice = {
    readonly failed: number;
    readonly reason: AppErrorCode;
};

export function noticeFor(outcome: AddImagesOutcome): AddNotice | null {
    if (outcome.failed === 0 || outcome.firstFailure === null) return null;
    return { failed: outcome.failed, reason: outcome.firstFailure };
}

function reasonText(t: TFunction, reason: AppErrorCode): string {
    return reason === "too-large"
        ? t("attachments.notice.tooLarge")
        : t(`errors.${reason}`);
}

export function noticeText(t: TFunction, notice: AddNotice): string {
    const reason = reasonText(t, notice.reason);
    return notice.failed === 1
        ? t("attachments.notice.skippedOne", { reason })
        : t("attachments.notice.skippedMany", {
              count: notice.failed,
              reason,
          });
}
