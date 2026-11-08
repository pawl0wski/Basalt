export const DEMO_WORKSPACE_ROOT = "/demo";

export const DEMO_WORKSPACE_FILES: Readonly<Record<string, string>> = {
    "Welcome.md":
        "# Welcome\n\nThis is the built-in demo workspace of the browser build.\n",
    "Ideas.md": "# Ideas\n\n- Write plain Markdown\n- Keep files in a folder\n",
    "projects/Roadmap.md": "# Roadmap\n\n1. Open a workspace\n2. Edit notes\n",
    "attachments/readme.txt": "Not a Markdown file, so it is not a note.\n",
};
