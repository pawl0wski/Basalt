import { expect, test, type JSHandle, type Page } from "@playwright/test";
import {
    externalWrite,
    failNextWrite,
    listFiles,
    openWorkspaceWith,
    readSavedBytes,
} from "./support";

const COLLISION = (name: string) =>
    `"${name}" already exists in the destination. Nothing was moved.`;

const FILES = {
    "Ideas.md": "1",
    "Todo.md": "2",
    "Notes.md": "3",
    "Plan.md": "4",
    "projects/IDEAS.md": "taken",
    "projects/TODO.md": "taken",
    "projects/NOTES.md": "taken",
    "projects/PLAN.md": "taken",
};

function notifications(page: Page) {
    return page.getByRole("region", { name: /Notifications/ });
}

function toasts(page: Page) {
    return notifications(page).getByRole("listitem");
}

function sidebar(page: Page) {
    return page.getByRole("navigation", { name: "Workspace" });
}

function tree(page: Page) {
    return page.getByRole("tree", { name: "Notes" });
}

function row(page: Page, name: string) {
    return tree(page).getByRole("treeitem", { name, exact: true });
}

async function dragNoteOnto(page: Page, note: string, folder: string) {
    const dataTransfer: JSHandle = await page.evaluateHandle(
        () => new DataTransfer(),
    );
    await row(page, note).dispatchEvent("dragstart", { dataTransfer });
    await row(page, folder).dispatchEvent("dragover", { dataTransfer });
    await row(page, folder).dispatchEvent("drop", { dataTransfer });
}

async function collide(page: Page, note: string) {
    await dragNoteOnto(page, note, "projects");
}

async function startRename(page: Page, name: string) {
    await row(page, name).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
    await expect(
        page.getByRole("dialog", { name: "Rename note" }),
    ).toBeVisible();
}

test.describe("a collision is a toast (AC-08.1, AC-08.8)", () => {
    test("a move collision shows a toast that dismisses itself and leaves the sidebar quiet", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const before = await listFiles(page);

        await collide(page, "Ideas");

        await expect(toasts(page)).toHaveCount(1);
        await expect(toasts(page).first()).toContainText(COLLISION("Ideas.md"));
        await expect(sidebar(page).getByRole("status")).toHaveCount(0);
        expect(await listFiles(page)).toEqual(before);
        await expect(toasts(page)).toHaveCount(0, { timeout: 9000 });
    });

    test("a rename onto a name that appeared after validation closes the dialog and toasts", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "alpha.md": "1" });
        await startRename(page, "alpha");
        await page.getByRole("textbox", { name: "Name" }).fill("beta");
        await externalWrite(page, "beta.md", "x");

        await page.keyboard.press("Enter");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(toasts(page)).toHaveCount(1);
        await expect(toasts(page).first()).toContainText("already exists");
        await expect(sidebar(page).getByRole("status")).toHaveCount(0);
        expect(await listFiles(page)).toContain("alpha.md");
    });

    test("an invalid name stays inline in the open dialog and shows no toast", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "alpha.md": "1" });
        await startRename(page, "alpha");

        await page.getByRole("textbox", { name: "Name" }).fill("a/b");

        await expect(
            page.getByRole("dialog").getByText("A name cannot contain"),
        ).toBeVisible();
        await expect(toasts(page)).toHaveCount(0);
    });
});

test.describe("a toast names its kind", () => {
    test("a collision toast is labelled Warning with an icon and a countdown line", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await collide(page, "Ideas");

        const toast = toasts(page).first();
        await expect(toast).toHaveAttribute("data-kind", "warning");
        await expect(toast).toContainText("Warning");
        await expect(toast.locator("svg").first()).toBeVisible();
        await expect(toast.getByTestId("toast-timer")).toBeAttached();
    });
});

test.describe("stacking and dismissal (AC-08.2, AC-08.6)", () => {
    test("shows at most three toasts, newest last, each with a close button", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        for (const note of ["Ideas", "Todo", "Notes", "Plan"])
            await collide(page, note);

        await expect(toasts(page)).toHaveCount(3);
        await expect(notifications(page)).not.toContainText("Ideas.md");
        const tops = await toasts(page).evaluateAll((items) =>
            items.map((item) => ({
                text: item.textContent ?? "",
                top: item.getBoundingClientRect().top,
            })),
        );
        const order = [...tops].sort((a, b) => a.top - b.top);
        expect(
            order.map((item) => item.text.match(/"(\w+)\.md"/)?.[1]),
        ).toEqual(["Todo", "Notes", "Plan"]);
        await toasts(page)
            .first()
            .getByRole("button", { name: "Dismiss" })
            .click();
        await expect(toasts(page)).toHaveCount(2);
    });

    test("hovering a toast pauses its auto-dismiss", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await collide(page, "Ideas");
        await expect(toasts(page)).toHaveCount(1);

        await toasts(page).first().hover();
        await page.waitForTimeout(6500);

        await expect(toasts(page)).toHaveCount(1);
        await page.mouse.move(0, 0);
        await expect(toasts(page)).toHaveCount(0, { timeout: 9000 });
    });

    test("Escape dismisses a focused toast", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await collide(page, "Ideas");
        await expect(toasts(page)).toHaveCount(1);

        await toasts(page).first().focus();
        await page.keyboard.press("Escape");

        await expect(toasts(page)).toHaveCount(0);
    });
});

test.describe("accessibility (AC-08.4, AC-08.5)", () => {
    test("the toast is announced through the region without moving focus", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").focus();

        await collide(page, "Ideas");

        await expect(toasts(page)).toHaveCount(1);
        await expect(
            page.getByRole("status").filter({ hasText: "Notifications" }),
        ).toHaveCount(1);
        await expect(row(page, "Ideas")).toBeFocused();
    });

    test("under reduced motion the toast has no animation or transition", async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await openWorkspaceWith(page, "/work/W", FILES);

        await collide(page, "Ideas");

        const toast = toasts(page).first();
        await expect(toast).toBeVisible();
        const style = await toast.evaluate((element) => {
            const computed = getComputedStyle(element);
            return {
                animation: computed.animationName,
                transition: computed.transitionDuration,
            };
        });
        expect(style.animation).toBe("none");
        expect(
            style.transition.split(",").every((d) => d.trim() === "0s"),
        ).toBe(true);
    });
});

test.describe("what stays persistent (AC-08.3)", () => {
    test("a read-only move shows the message in the sidebar, not a toast", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/W",
            { "Ideas.md": "1", "projects/Roadmap.md": "2" },
            { readOnly: true },
        );

        await dragNoteOnto(page, "Ideas", "projects");

        await expect(sidebar(page).getByRole("status")).toContainText(
            "The workspace folder is read-only. Nothing was changed.",
        );
        await expect(toasts(page)).toHaveCount(0);
    });

    test("a failed save while leaving a note opens the Save-failed dialog, not a toast", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
        await row(page, "a").click();
        await page.getByRole("textbox", { name: "a" }).click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("typed");
        await failNextWrite(page);

        await page.getByRole("button", { name: "Close a" }).click();

        await expect(page.getByRole("alertdialog")).toBeVisible();
        await expect(toasts(page)).toHaveCount(0);
    });
});

test.describe("partial failures (AC-08.7)", () => {
    test("a note that moves but cannot have its links rewritten keeps its bytes and shows a toast", async ({
        page,
    }) => {
        const invalidUtf8 = [0xff, 0xff];
        await openWorkspaceWith(page, "/work/W", {
            "Broken.md": Uint8Array.from(invalidUtf8),
            "projects/Roadmap.md": "roadmap",
        });

        await dragNoteOnto(page, "Broken", "projects");

        await expect(toasts(page)).toHaveCount(1);
        await expect(toasts(page).first()).toContainText(
            'Moved 1 of 1 notes. "Broken.md" was moved but its links could not be updated',
        );
        await expect(sidebar(page).getByRole("status")).toHaveCount(0);
        expect(await listFiles(page)).toEqual([
            "projects/Broken.md",
            "projects/Roadmap.md",
        ]);
        expect(await readSavedBytes(page, "projects/Broken.md")).toEqual(
            invalidUtf8,
        );
    });
});
