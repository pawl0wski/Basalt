import type { ReactNode } from "react";

type NoteColumnProps = {
    banner?: ReactNode;
    children?: ReactNode;
};

export function NoteColumn({ banner, children }: NoteColumnProps) {
    return (
        <article className="mx-auto flex w-full max-w-note flex-col gap-note-block px-note-x py-section">
            {banner}
            {children ?? <WeeklyPlan />}
        </article>
    );
}

export function WeeklyPlan() {
    return (
        <>
            <h1 className="text-size-note-h1 text-text-note">Weekly plan</h1>
            <h2 className="text-size-note-h2 text-text-note">Monday</h2>
            <p className="text-size-note text-text-note">
                Review the sync server spec before the encryption work starts, and write down the open questions.
            </p>
            <ul className="m-none flex list-disc flex-col gap-in-group pl-section text-size-note text-text-note">
                <li>Check how images are stored next to notes</li>
                <li>Decide what the status bar shows</li>
                <li>Move the reading list to its own note</li>
            </ul>
            <h2 className="text-size-note-h2 text-text-note">Thursday</h2>
            <p className="text-size-note text-text-note">
                Try the app on a folder with a few hundred notes and see whether the list stays fast.
            </p>
        </>
    );
}
