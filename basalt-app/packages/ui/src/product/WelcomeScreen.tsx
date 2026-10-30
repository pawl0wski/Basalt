import { FolderOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

type WelcomeScreenProps = {
    onOpenWorkspace: () => void;
    notice?: ReactNode;
};

function WelcomeScreen({ onOpenWorkspace, notice }: WelcomeScreenProps) {
    return (
        <main className="bs-welcome flex min-h-full w-full flex-col items-start justify-center gap-section p-section">
            <div className="flex max-w-prose flex-col gap-between-groups">
                <h1 className="text-size-note-h1 text-text-note">Basalt</h1>
                <p className="text-size-note text-text-ui">
                    Notes kept as plain Markdown files in a folder you choose.
                </p>
            </div>
            {notice ? (
                <div className="max-w-prose">
                    <Alert variant="warning" title="Workspace unavailable">
                        {notice}
                    </Alert>
                </div>
            ) : null}
            <div>
                <Button size="lg" onClick={onOpenWorkspace}>
                    <FolderOpen aria-hidden="true" />
                    Open folder as workspace
                </Button>
            </div>
        </main>
    );
}

export { WelcomeScreen };
export type { WelcomeScreenProps };
