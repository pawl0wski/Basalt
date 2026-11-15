import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspacePath } from "@basalt/core";
import { toImageSource } from "../attachments/image-source";
import { useServices } from "../../useServices";
import { NoteEditor, type NoteEditorProps } from "./NoteEditor";

type NoteSessionEditorProps = Omit<NoteEditorProps, "images"> & {
    notePath: WorkspacePath;
};

export function NoteSessionEditor({
    notePath,
    ...props
}: NoteSessionEditorProps) {
    const { t } = useTranslation();
    const { images } = useServices();
    const noteImages = useMemo(
        () => images.forNote(notePath),
        [images, notePath],
    );

    useEffect(() => {
        noteImages.activate();
        return () => {
            noteImages.dispose();
        };
    }, [noteImages]);

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
                },
            },
            subscribe: noteImages.subscribe,
        }),
        [noteImages, t],
    );

    return <NoteEditor {...props} images={editorImages} />;
}
