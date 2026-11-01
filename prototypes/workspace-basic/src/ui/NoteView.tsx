import { Alert, Button, NoteBanner, Skeleton } from "@basalt/ui";
import { useStore } from "../model/store";
import type { Tab } from "../model/types";
import { Editor } from "./Editor";

function Banner({ tab }: { tab: Tab }) {
    const { dispatch } = useStore();
    if (tab.open === "too-large") return <NoteBanner kind="too-large" />;
    if (tab.open === "not-utf8") return <NoteBanner kind="not-utf8" />;
    if (tab.open === "symlink" || tab.open === "unknown")
        return (
            <div data-gap="DSG-08">
                <Alert
                    variant="info"
                    title={
                        tab.open === "symlink"
                            ? "This note is a symbolic link"
                            : "This note could not be opened"
                    }
                >
                    {tab.open === "symlink"
                        ? "Basalt does not follow symbolic links, so the note is not opened and never changed."
                        : "An unknown error stopped Basalt from opening the file. It is never changed."}
                </Alert>
            </div>
        );
    if (tab.banner === "permission-denied")
        return (
            <NoteBanner
                kind="permission-denied"
                onRetry={() => dispatch({ type: "retry-save", path: tab.path })}
            />
        );
    if (tab.banner === "conflict")
        return (
            <NoteBanner
                kind="conflict"
                onKeepMine={() =>
                    dispatch({ type: "keep-mine", path: tab.path })
                }
                onLoadFromDisk={() =>
                    dispatch({
                        type: "open-dialog",
                        dialog: {
                            kind: "discard-edits",
                            path: tab.path,
                            action: "load-from-disk",
                        },
                    })
                }
            />
        );
    if (tab.banner === "deleted")
        return (
            <NoteBanner
                kind="deleted"
                onSaveAgain={() =>
                    dispatch({ type: "save-again", path: tab.path })
                }
                onCloseNote={() =>
                    dispatch({ type: "close-deleted", path: tab.path })
                }
            />
        );
    if (tab.banner === "workspace-lost")
        return (
            <div data-gap="DSG-08">
                <Alert
                    variant="danger"
                    title="The workspace folder is not available"
                    action={
                        <div className="flex flex-col gap-between-groups tablet:flex-row">
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    dispatch({
                                        type: "retry-save",
                                        path: tab.path,
                                    })
                                }
                            >
                                Retry
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    dispatch({
                                        type: "request-change-workspace",
                                    })
                                }
                            >
                                Change workspace
                            </Button>
                        </div>
                    }
                >
                    The folder was deleted or renamed. Your text is kept here
                    and saving is paused.
                </Alert>
            </div>
        );
    return null;
}

function NoteSkeleton() {
    return (
        <div
            data-gap="DSG-09"
            role="status"
            aria-busy="true"
            className="mx-auto flex w-full max-w-note flex-col gap-between-groups px-note-x py-section"
        >
            <span className="sr-only">Opening note</span>
            <Skeleton className="h-section" />
            <Skeleton className="h-tree-row" />
            <Skeleton className="h-tree-row" />
        </div>
    );
}

export function NoteView({ tab }: { tab: Tab }) {
    const { state, dispatch } = useStore();
    const banner = <Banner tab={tab} />;
    const notices = (
        <>
            {state.addNotice ? (
                <div data-gap="DSG-06" className="flex flex-col gap-in-group">
                    <Alert variant="warning" title="Images">
                        {state.addNotice}
                    </Alert>
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                dispatch({ type: "dismiss-add-notice" })
                            }
                        >
                            Dismiss notice
                        </Button>
                    </div>
                </div>
            ) : null}
            {state.adding ? (
                <div data-gap="DSG-10">
                    <Alert variant="info" title="Adding image">
                        The image file is being written to the workspace. The
                        link appears when it is done.
                    </Alert>
                </div>
            ) : null}
        </>
    );
    return (
        <div className="flex min-h-full flex-col">
            <div className="sticky top-0 z-10 mx-auto flex w-full max-w-note flex-col gap-between-groups bg-surface-editor px-note-x pt-between-groups empty:hidden">
                {banner}
                {notices}
            </div>
            {tab.loading ? <NoteSkeleton /> : null}
            {!tab.loading && tab.open === "ok" ? (
                <Editor
                    key={tab.path}
                    tab={tab}
                    files={state.workspace?.files ?? {}}
                    imagesSlow={state.scenario.imagesSlow}
                    dragOver={state.dragOver}
                    onChange={(text) =>
                        dispatch({ type: "edit", path: tab.path, text })
                    }
                    onCursor={(line) =>
                        dispatch({ type: "set-cursor", path: tab.path, line })
                    }
                />
            ) : null}
        </div>
    );
}
