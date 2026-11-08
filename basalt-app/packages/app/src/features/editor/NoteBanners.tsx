import type { ReactNode } from "react";
import { Button } from "@basalt/ui";
import { ErrorBanner } from "./ErrorBanner";

type BannerText = { title: string; message: string };

type BannerAction = { label: string; onClick: () => void };

type ActionBannerProps = BannerText & {
    variant: "danger" | "warning";
    primary: BannerAction;
    secondary: BannerAction;
};

function ActionBanner({
    title,
    message,
    variant,
    primary,
    secondary,
}: ActionBannerProps): ReactNode {
    return (
        <ErrorBanner
            title={title}
            message={message}
            variant={variant}
            action={
                <div className="flex flex-col gap-between-groups tablet:flex-row">
                    <Button variant="secondary" onClick={primary.onClick}>
                        {primary.label}
                    </Button>
                    <Button variant="ghost" onClick={secondary.onClick}>
                        {secondary.label}
                    </Button>
                </div>
            }
        />
    );
}

export type ConflictBannerProps = BannerText & {
    keepMine: BannerAction;
    loadFromDisk: BannerAction;
};

export function ConflictBanner({
    title,
    message,
    keepMine,
    loadFromDisk,
}: ConflictBannerProps) {
    return (
        <ActionBanner
            title={title}
            message={message}
            variant="warning"
            primary={keepMine}
            secondary={loadFromDisk}
        />
    );
}

export type DeletedBannerProps = BannerText & {
    saveAgain: BannerAction;
    closeNote: BannerAction;
};

export function DeletedBanner({
    title,
    message,
    saveAgain,
    closeNote,
}: DeletedBannerProps) {
    return (
        <ActionBanner
            title={title}
            message={message}
            variant="warning"
            primary={saveAgain}
            secondary={closeNote}
        />
    );
}

export type WorkspaceUnavailableBannerProps = BannerText & {
    retry: BannerAction;
    changeWorkspace: BannerAction;
};

export function WorkspaceUnavailableBanner({
    title,
    message,
    retry,
    changeWorkspace,
}: WorkspaceUnavailableBannerProps) {
    return (
        <ActionBanner
            title={title}
            message={message}
            variant="danger"
            primary={retry}
            secondary={changeWorkspace}
        />
    );
}
