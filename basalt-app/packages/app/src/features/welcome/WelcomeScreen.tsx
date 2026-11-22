import { FileText, FolderOpen, LockKeyhole } from "lucide-react";
import { Alert, Button, Card } from "@basalt/ui";

const principleIcons = {
    markdown: FileText,
    workspace: FolderOpen,
    private: LockKeyhole,
};

export type WelcomePrinciple = {
    id: keyof typeof principleIcons;
    title: string;
    description: string;
};

export type WelcomeMessage = {
    title: string;
    message: string;
};

export type WelcomeScreenProps = {
    texts: {
        headline: string;
        intro: string;
        openFolder: string;
        folderHint: string;
    };
    principles: readonly WelcomePrinciple[];
    notice?: WelcomeMessage | null;
    error?: WelcomeMessage | null;
    busy?: boolean;
    onOpenFolder: () => void;
};

export function WelcomeScreen({
    texts,
    principles,
    notice = null,
    error = null,
    busy = false,
    onOpenFolder,
}: WelcomeScreenProps) {
    return (
        <div
            className="scrollbar-thin flex h-full flex-col overflow-y-auto bg-surface-editor text-text-ui focus-visible:focus-ring-inset"
            tabIndex={0}
        >
            <div className="mx-auto flex w-full max-w-note flex-1 flex-col gap-section px-note-x py-section">
                <div className="flex flex-col gap-between-groups">
                    <h1 className="text-size-note-h1 text-text-note">
                        {texts.headline}
                    </h1>
                    <p className="max-w-prose text-size-note text-text-ui">
                        {texts.intro}
                    </p>
                </div>

                {notice ? (
                    <Alert variant="warning" title={notice.title}>
                        {notice.message}
                    </Alert>
                ) : null}
                {error ? (
                    <Alert variant="danger" title={error.title}>
                        {error.message}
                    </Alert>
                ) : null}

                <div className="flex flex-col gap-in-group">
                    <div className="flex flex-col gap-between-groups tablet:flex-row">
                        <Button
                            aria-busy={busy}
                            className="w-full tablet:w-auto"
                            disabled={busy}
                            onClick={onOpenFolder}
                            size="lg"
                        >
                            <FolderOpen aria-hidden="true" />
                            {texts.openFolder}
                        </Button>
                    </div>
                    <p className="text-size-ui-small text-text-muted">
                        {texts.folderHint}
                    </p>
                </div>

                <Card>
                    {principles.map(({ id, title, description }) => {
                        const Icon = principleIcons[id];
                        return (
                            <article
                                className="flex items-start gap-between-groups p-settings-card"
                                key={id}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="size-icon shrink-0 text-icon-default"
                                />
                                <div className="flex flex-col gap-in-group">
                                    <h2 className="font-ui-strong text-size-ui text-text-ui">
                                        {title}
                                    </h2>
                                    <p className="text-size-ui-small text-text-muted">
                                        {description}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </Card>
            </div>
        </div>
    );
}
