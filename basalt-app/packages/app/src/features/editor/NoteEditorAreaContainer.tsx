import { useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { Alert, Button, ConfirmDialog } from "@basalt/ui";
import type { WorkspacePath } from "@basalt/core";
import { isDirty, type NoteSession } from "../notes/notes-store";
import { ErrorBanner } from "./ErrorBanner";
import {
    ConflictBanner,
    DeletedBanner,
    WorkspaceAccessBanner,
    WorkspaceUnavailableBanner,
} from "./NoteBanners";
import { NoteSessionEditor } from "./NoteSessionEditor";
import { NoteOpenError } from "./NoteOpenError";
import { noteTitle } from "./note-title";
import { openErrorMessage } from "./open-error-message";
import { titleErrorText } from "./title-error";

type PendingConfirm = {
    readonly kind: "reload" | "close";
    readonly path: WorkspacePath;
};

export function NoteEditorAreaContainer() {
    const { t } = useTranslation();
    const { notesStore, notesActions, workspaceStore, workspaceActions } =
        useServices();
    const unavailable = useStore(workspaceStore, (state) => state.unavailable);
    const accessNeeded = useStore(
        workspaceStore,
        (state) => state.accessNeeded,
    );
    const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
    const openNotes = useStore(notesStore, (state) => state.openNotes);
    const activeNote = useStore(notesStore, (state) => state.activeNote);
    const focusRequest = useStore(notesStore, (state) => state.focusRequest);

    const unavailableBanner = (
        <WorkspaceUnavailableBanner
            title={t("workspace.unavailable.title")}
            message={t("workspace.unavailable.message")}
            retry={{
                label: t("workspace.unavailable.retry"),
                onClick: () => {
                    void workspaceActions.retryLost();
                },
            }}
            changeWorkspace={{
                label: t("workspace.unavailable.changeWorkspace"),
                onClick: () => {
                    void workspaceActions.openWorkspace();
                },
            }}
        />
    );

    const accessBanner = (
        <WorkspaceAccessBanner
            title={t("workspace.accessNeeded.title")}
            message={t("workspace.accessNeeded.message")}
            grantAccess={{
                label: t("workspace.accessNeeded.grant"),
                onClick: () => {
                    void workspaceActions.regrantAccess();
                },
            }}
            changeWorkspace={{
                label: t("workspace.accessNeeded.changeWorkspace"),
                onClick: () => {
                    void workspaceActions.openWorkspace();
                },
            }}
        />
    );

    function askOrRun(
        session: NoteSession,
        kind: PendingConfirm["kind"],
        run: () => void,
    ) {
        if (isDirty(session)) setConfirm({ kind, path: session.path });
        else run();
    }

    function reload(path: WorkspacePath) {
        void notesActions.reloadNote(path);
    }

    function close(path: WorkspacePath) {
        void notesActions.closeTab(path, { discard: true });
    }

    function noteBanner(session: NoteSession): ReactNode {
        const code = session.error?.code;
        if (code === "conflict") {
            return (
                <ConflictBanner
                    title={t("notes.conflict.title")}
                    message={t("notes.conflict.message")}
                    keepMine={{
                        label: t("notes.conflict.keepMine"),
                        onClick: () => {
                            void notesActions.keepMine(session.path);
                        },
                    }}
                    loadFromDisk={{
                        label: t("notes.conflict.loadFromDisk"),
                        onClick: () => {
                            askOrRun(session, "reload", () => {
                                reload(session.path);
                            });
                        },
                    }}
                />
            );
        }
        if (code === "not-found") {
            return (
                <DeletedBanner
                    title={t("notes.deleted.title")}
                    message={t("notes.deleted.message")}
                    saveAgain={{
                        label: t("notes.deleted.saveAgain"),
                        onClick: () => {
                            void notesActions.saveAgain(session.path);
                        },
                    }}
                    closeNote={{
                        label: t("notes.deleted.closeNote"),
                        onClick: () => {
                            askOrRun(session, "close", () => {
                                close(session.path);
                            });
                        },
                    }}
                />
            );
        }
        if (!session.error) return null;
        return (
            <ErrorBanner
                title={t("notes.saveError.title")}
                message={t("notes.saveError.message", {
                    reason: t(`errors.${session.error.code}`),
                })}
                action={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            void notesActions.saveNow(session.path);
                        }}
                    >
                        {t("notes.saveError.retry")}
                    </Button>
                }
            />
        );
    }

    const confirmName = confirm ? noteTitle(confirm.path) : "";
    const confirmKey =
        confirm?.kind === "close" ? "confirmClose" : "confirmReload";

    return (
        <>
            <ConfirmDialog
                open={confirm !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirm(null);
                }}
                title={t(`notes.${confirmKey}.title`)}
                description={t(`notes.${confirmKey}.message`, {
                    name: confirmName,
                })}
                confirmLabel={t(`notes.${confirmKey}.confirm`)}
                cancelLabel={t(`notes.${confirmKey}.cancel`)}
                destructive
                onConfirm={() => {
                    if (!confirm) return;
                    if (confirm.kind === "reload") reload(confirm.path);
                    else close(confirm.path);
                }}
            />
            {openNotes.map((session) => {
                const title = noteTitle(session.path);
                return (
                    <div
                        key={session.id}
                        hidden={session.path !== activeNote}
                        className={`mx-auto h-full w-full max-w-note flex-col px-note-x py-between-groups ${session.path === activeNote ? "flex" : "hidden"}`}
                    >
                        {unavailable ? unavailableBanner : null}
                        {accessNeeded && !unavailable ? accessBanner : null}
                        {session.openFailed && session.error ? (
                            <NoteOpenError
                                title={t("notes.openError.title")}
                                message={openErrorMessage(
                                    t,
                                    session.error.code,
                                )}
                            />
                        ) : (
                            <>
                                {unavailable ? null : noteBanner(session)}
                                {session.titleError ? (
                                    <Alert
                                        role="status"
                                        variant="warning"
                                        onDismiss={() => {
                                            notesActions.dismissTitleError(
                                                session.path,
                                            );
                                        }}
                                        dismissLabel={t(
                                            "notes.titleError.dismiss",
                                        )}
                                        className="mb-between-groups"
                                    >
                                        {titleErrorText(t, session)}
                                    </Alert>
                                ) : null}
                                <NoteSessionEditor
                                    notePath={session.path}
                                    active={session.path === activeNote}
                                    label={title}
                                    text={session.text}
                                    focusRequest={
                                        focusRequest?.path === session.path
                                            ? focusRequest.id
                                            : 0
                                    }
                                    focusPosition={
                                        focusRequest?.path === session.path
                                            ? focusRequest.position
                                            : null
                                    }
                                    onTitleLeave={() => {
                                        void notesActions.commitTitle(
                                            session.path,
                                        );
                                    }}
                                    onChange={(text) => {
                                        notesActions.updateText(
                                            session.path,
                                            text,
                                        );
                                    }}
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
}
