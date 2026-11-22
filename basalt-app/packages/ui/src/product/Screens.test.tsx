import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImagePlaceholder, NoteImage } from "./ImagePlaceholder";
import { NoteSidebar } from "./NoteSidebar";
import { WelcomeScreen } from "./WelcomeScreen";

describe("WelcomeScreen", () => {
    it("has a single action that opens the workspace picker", async () => {
        const user = userEvent.setup();
        const onOpenWorkspace = vi.fn();

        render(<WelcomeScreen onOpenWorkspace={onOpenWorkspace} />);
        await user.click(
            screen.getByRole("button", { name: "Open folder as workspace" }),
        );

        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(onOpenWorkspace).toHaveBeenCalledOnce();
    });

    it("explains why the workspace is unavailable", () => {
        render(
            <WelcomeScreen
                onOpenWorkspace={() => {}}
                notice="The folder Personal notes is no longer available."
            />,
        );

        expect(screen.getByRole("status").textContent).toContain(
            "The folder Personal notes is no longer available.",
        );
    });
});

describe("NoteSidebar", () => {
    it("shows the workspace name, reports New note and has no Change workspace button", async () => {
        const user = userEvent.setup();
        const onNewNote = vi.fn();

        render(
            <NoteSidebar workspaceName="Personal notes" onNewNote={onNewNote}>
                <p>list</p>
            </NoteSidebar>,
        );
        await user.click(screen.getByRole("button", { name: "New note" }));

        expect(
            screen.getByRole("navigation", { name: "Workspace" }).textContent,
        ).toContain("Personal notes");
        expect(onNewNote).toHaveBeenCalledOnce();
        expect(
            screen.queryByRole("button", { name: "Change workspace" }),
        ).toBeNull();
    });

    it("shows a notice above the list only when given", () => {
        const { rerender } = render(
            <NoteSidebar workspaceName="W" onNewNote={() => {}}>
                <p>list</p>
            </NoteSidebar>,
        );
        expect(screen.queryByRole("status")).toBeNull();

        rerender(
            <NoteSidebar
                workspaceName="W"
                onNewNote={() => {}}
                notice="The list refreshes when the window is focused."
            >
                <p>list</p>
            </NoteSidebar>,
        );
        expect(screen.getByRole("status").textContent).toContain(
            "refreshes when the window is focused",
        );
    });
});

describe("NoteSidebar notices", () => {
    function scrollers(container: HTMLElement) {
        return container.querySelectorAll(".overflow-y-auto");
    }

    it("keeps the notice and the error in a fixed slot above the only scroller", () => {
        const { container } = render(
            <NoteSidebar
                workspaceName="W"
                onNewNote={vi.fn()}
                notice="Watching is off"
                error="Could not move the note"
            >
                <p>tree</p>
            </NoteSidebar>,
        );

        const scroller = scrollers(container)[0];
        expect(scrollers(container)).toHaveLength(1);
        expect(scroller.contains(screen.getByText("tree"))).toBe(true);
        expect(scroller.contains(screen.getByText("Watching is off"))).toBe(
            false,
        );
        expect(
            scroller.contains(screen.getByText("Could not move the note")),
        ).toBe(false);
        expect(
            screen
                .getByText("Could not move the note")
                .compareDocumentPosition(screen.getByText("tree")) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it("renders no slot without a notice or an error and the tree scroller carries the scrollbar treatment", () => {
        const { container } = render(
            <NoteSidebar workspaceName="W" onNewNote={vi.fn()}>
                <p>tree</p>
            </NoteSidebar>,
        );

        expect(screen.queryByRole("alert")).toBeNull();
        expect(
            scrollers(container)[0]?.classList.contains("scrollbar-thin"),
        ).toBe(true);
    });
});

describe("ImagePlaceholder", () => {
    it.each([
        ["loading", "Loading image"],
        ["unreadable", "Image could not be read"],
        ["unsupported", "Format not supported"],
        ["too-large", "Image is too large (over 20 MiB or 100 megapixels)"],
        ["remote", "Remote images are not loaded"],
        ["invalid", "Invalid image link"],
    ] as const)("says %s in text", (problem, text) => {
        render(<ImagePlaceholder problem={problem} />);

        expect(screen.getByText(text)).toBeTruthy();
    });

    it("names the missing file", () => {
        render(
            <ImagePlaceholder problem="not-found" path="attachments/x.png" />,
        );

        expect(
            screen.getByText("Image not found: attachments/x.png"),
        ).toBeTruthy();
    });
});

describe("NoteImage", () => {
    it("keeps the alt text and reserves the final height from its dimensions", () => {
        render(
            <NoteImage
                src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                alt="Whiteboard photo"
                width={1600}
                height={900}
            />,
        );

        const image = screen.getByRole("img", { name: "Whiteboard photo" });
        expect(image.getAttribute("width")).toBe("1600");
        expect(image.style.aspectRatio).toBe("1600 / 900");
    });

    it("sets no aspect ratio when the dimensions are unknown", () => {
        render(
            <NoteImage
                src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                alt="Photo"
            />,
        );

        expect(screen.getByRole("img").style.aspectRatio).toBe("");
    });
});
