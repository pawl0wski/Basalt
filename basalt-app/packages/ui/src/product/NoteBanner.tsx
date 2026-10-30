import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

type NoteBannerProps =
    | { kind: "conflict"; onKeepMine: () => void; onLoadFromDisk: () => void }
    | { kind: "deleted"; onSaveAgain: () => void; onCloseNote: () => void }
    | { kind: "permission-denied"; onRetry: () => void }
    | { kind: "too-large" }
    | { kind: "not-utf8" };

function NoteBanner(props: NoteBannerProps) {
    switch (props.kind) {
        case "conflict":
            return (
                <Alert
                    variant="warning"
                    title="This note changed on disk"
                    action={
                        <div className="flex flex-col gap-between-groups tablet:flex-row">
                            <Button variant="secondary" onClick={props.onKeepMine}>
                                Keep my version
                            </Button>
                            <Button variant="ghost" onClick={props.onLoadFromDisk}>
                                Load version from disk
                            </Button>
                        </div>
                    }
                >
                    Another program changed this file while you had unsaved edits. Saving is paused until you choose.
                </Alert>
            );
        case "deleted":
            return (
                <Alert
                    variant="warning"
                    title="This note was deleted or moved"
                    action={
                        <div className="flex flex-col gap-between-groups tablet:flex-row">
                            <Button variant="secondary" onClick={props.onSaveAgain}>
                                Save again here
                            </Button>
                            <Button variant="ghost" onClick={props.onCloseNote}>
                                Close note
                            </Button>
                        </div>
                    }
                >
                    The file is no longer in the workspace. Saving is paused so it is not recreated by accident.
                </Alert>
            );
        case "permission-denied":
            return (
                <Alert
                    variant="danger"
                    title="Could not save the note"
                    action={
                        <Button variant="secondary" onClick={props.onRetry}>
                            Retry
                        </Button>
                    }
                >
                    The workspace folder is read-only. Your text is kept here and saving is paused.
                </Alert>
            );
        case "too-large":
            return (
                <Alert variant="info" title="This note is too large to edit">
                    Notes over 5 MiB are listed but not opened in the editor. The file is not changed.
                </Alert>
            );
        case "not-utf8":
            return (
                <Alert variant="info" title="This file is not UTF-8 text">
                    Basalt does not open it, so it is never changed.
                </Alert>
            );
    }
}

export { NoteBanner };
export type { NoteBannerProps };
