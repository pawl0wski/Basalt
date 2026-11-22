import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspacePath } from "@basalt/core";
import { Alert } from "@basalt/ui";
import {
    noticeFor,
    noticeText,
    type AddNotice,
} from "../attachments/add-notice";
import { toImageSource } from "../attachments/image-source";
import { useServices } from "../../useServices";
import { NoteEditor, type NoteEditorProps } from "./NoteEditor";

type NoteSessionEditorProps = Omit<NoteEditorProps, "images" | "files"> & {
    notePath: WorkspacePath;
    active: boolean;
};

export function NoteSessionEditor({
    notePath,
    active,
    ...props
}: NoteSessionEditorProps) {
    const { t } = useTranslation();
    const { images } = useServices();
    const [notice, setNotice] = useState<AddNotice | null>(null);
    const directory = notePath.slice(0, notePath.lastIndexOf("/") + 1);
    const [hub, setHub] = useState({ directory, path: notePath });
    if (hub.directory !== directory) setHub({ directory, path: notePath });
    const hubPath = hub.directory === directory ? hub.path : notePath;
    const noteImages = useMemo(
        () => images.forNote(hubPath),
        [images, hubPath],
    );

    useEffect(() => {
        noteImages.activate();
        return () => {
            noteImages.dispose();
        };
    }, [noteImages]);

    useEffect(() => {
        if (!active) setNotice(null);
    }, [active]);

    const editorImages = useMemo(
        () => ({
            options: {
                resolve: async (destination: string) =>
                    toImageSource(
                        await noteImages.loader.load(destination),
                        destination,
                        t,
                    ),
                release: (destination: string) => {
                    noteImages.loader.release(destination);
                },
                labels: {
                    loading: t("attachments.placeholder.loading"),
                    broken: t("attachments.placeholder.broken"),
                    resize: t("attachments.resize.label"),
                },
            },
            subscribe: noteImages.subscribe,
        }),
        [noteImages, t],
    );

    const files = useMemo(
        () => ({
            onFiles: async (dropped: readonly File[]) => {
                const outcome = await noteImages.addFiles(dropped);
                setNotice(noticeFor(outcome));
                return outcome.links;
            },
        }),
        [noteImages],
    );

    return (
        <>
            {notice ? (
                <Alert
                    role="status"
                    onDismiss={() => {
                        setNotice(null);
                    }}
                    dismissLabel={t("attachments.notice.dismiss")}
                    className="mb-between-groups"
                >
                    {noticeText(t, notice)}
                </Alert>
            ) : null}
            <NoteEditor
                key={hubPath}
                {...props}
                images={editorImages}
                files={files}
            />
        </>
    );
}
