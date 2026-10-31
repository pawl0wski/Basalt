import { BookOpen, FileText, FolderOpen, LockKeyhole } from "lucide-react";
import { Button, Card } from "@basalt/ui";

const principles = [
    {
        icon: FileText,
        title: "Plain Markdown",
        description: "Your notes stay as simple files you can open anywhere.",
    },
    {
        icon: FolderOpen,
        title: "Your workspace",
        description: "Choose a folder you already use, or create a new one.",
    },
    {
        icon: LockKeyhole,
        title: "Private by design",
        description:
            "Your notes live on your device and remain in your control.",
    },
];

function App() {
    return (
        <div className="flex min-h-svh flex-col bg-surface-editor text-text-ui">
            <header className="mx-auto flex w-full max-w-note items-center gap-in-group px-note-x py-panel">
                <BookOpen
                    aria-hidden="true"
                    className="size-icon text-icon-default"
                />
                <a
                    className="rounded-control text-size-ui text-text-ui focus-visible:focus-ring"
                    href="#home"
                >
                    Basalt
                </a>
            </header>

            <main
                className="mx-auto flex w-full max-w-note flex-1 flex-col gap-section px-note-x py-section"
                id="home"
            >
                <div className="flex flex-col gap-between-groups">
                    <h1 className="text-size-note-h1 text-text-note">
                        Make room for what matters.
                    </h1>
                    <p className="max-w-prose text-size-note text-text-ui">
                        A space for notes, plans, and everything you want to
                        remember. Simple files, kept where you choose.
                    </p>
                </div>

                <div className="flex flex-col gap-in-group">
                    <div className="flex flex-col gap-between-groups tablet:flex-row">
                        <Button className="w-full tablet:w-auto" size="lg">
                            <FolderOpen aria-hidden="true" />
                            Choose a workspace
                        </Button>
                        <Button
                            className="w-full tablet:w-auto"
                            size="lg"
                            variant="secondary"
                        >
                            Create new workspace
                        </Button>
                    </div>
                    <p className="text-size-ui-small text-text-muted">
                        Markdown files and attachments stay in your folder.
                    </p>
                </div>

                <Card>
                    {principles.map(({ icon: Icon, title, description }) => (
                        <article
                            className="flex items-start gap-between-groups p-settings-card"
                            key={title}
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
                    ))}
                </Card>
            </main>
        </div>
    );
}

export default App;
