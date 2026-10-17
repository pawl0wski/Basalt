import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  FolderOpen,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Button } from "@/../../ui/src";

const features = [
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
    description: "Your notes live on your device and remain in your control.",
  },
];

function App() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.12),transparent_65%)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <a aria-label="Basalt home" className="flex items-center gap-3" href="#home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BookOpen className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-semibold tracking-tight">basalt</span>
        </a>
        <span className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Your notes. Your files. Your space.
        </span>
      </header>

      <section
        className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-14 pt-10 sm:px-10 sm:pb-20 sm:pt-16"
        id="home"
      >
        <div className="mx-auto w-full max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            A calmer home for your ideas
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl">
            Make room for
            <span className="block text-primary">what matters.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            A thoughtful space for notes, plans, and everything you want to remember. Simple files, kept where you choose.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" size="lg">
              <FolderOpen />
              Choose a workspace
              <ArrowRight />
            </Button>
            <Button className="w-full sm:w-auto" size="lg" variant="outline">
              Create new workspace
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-primary" />
            Markdown files and attachments stay in your folder
          </div>
        </div>

        <div className="mx-auto mt-16 grid w-full max-w-4xl gap-3 sm:mt-20 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              className="rounded-2xl border border-border/70 bg-card/70 p-5 text-left shadow-sm shadow-black/[0.02] backdrop-blur-sm sm:p-6"
              key={title}
            >
              <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowDown className="size-3.5" />
          Start with a folder. Grow at your own pace.
        </div>
      </section>

      <footer className="relative px-6 py-5 text-center text-xs text-muted-foreground/70">
        Basalt · A little more space to think
      </footer>
    </main>
  );
}

export default App;
