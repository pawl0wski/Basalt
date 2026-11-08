import { Alert } from "@basalt/ui";

export type NoteOpenErrorProps = {
    title: string;
    message: string;
};

export function NoteOpenError({ title, message }: NoteOpenErrorProps) {
    return (
        <Alert variant="info" title={title}>
            {message}
        </Alert>
    );
}
