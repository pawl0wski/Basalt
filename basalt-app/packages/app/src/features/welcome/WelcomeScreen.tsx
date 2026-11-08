import { BookOpen, FileText, FolderOpen, LockKeyhole } from "lucide-react";
import { Button, Card } from "@basalt/ui";

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

export type WelcomeScreenProps = {
    texts: {
        brand: string;
        headline: string;
        intro: string;
        openFolder: string;
        folderHint: string;
    };
    principles: readonly WelcomePrinciple[];
    onOpenFolder: () => void;
};

export function WelcomeScreen({
    texts,
    principles,
    onOpenFolder,
}: WelcomeScreenProps) {
    return (
        <div className="flex min-h-full flex-col bg-surface-editor text-text-ui">
            <header className="mx-auto flex w-full max-w-note items-center gap-in-group px-note-x py-panel">
                <BookOpen
                    aria-hidden="true"
                    className="size-icon text-icon-default"
                />
                <a
                    className="rounded-control text-size-ui text-text-ui focus-visible:focus-ring"
                    href="#home"
                >
                    {texts.brand}
                </a>
            </header>

            <div
                className="mx-auto flex w-full max-w-note flex-1 flex-col gap-section px-note-x py-section"
                id="home"
            >
                <div className="flex flex-col gap-between-groups">
                    <h1 className="text-size-note-h1 text-text-note">
                        {texts.headline}
                    </h1>
                    <p className="max-w-prose text-size-note text-text-ui">
                        {texts.intro}
                    </p>
                </div>

                <div className="flex flex-col gap-in-group">
                    <div className="flex flex-col gap-between-groups tablet:flex-row">
                        <Button
                            className="w-full tablet:w-auto"
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
