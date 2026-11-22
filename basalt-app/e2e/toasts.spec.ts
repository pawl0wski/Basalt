import { expect, test, type JSHandle, type Page } from "@playwright/test";
import {
    advanceClock,
    externalWrite,
    failNextWrite,
    freezeClock,
    installClock,
    listFiles,
    openWorkspaceWith,
    readSavedBytes,
} from "./support";

const TOAST_DURATION_MS = 5000;

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
    test(
        "shows a collision toast that dismisses itself, changes no file and leaves the sidebar without a message when a note is moved onto an existing name",
        { tag: "@TOASTS-001" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await freezeClock(page);
            const before = await listFiles(page);

            await collide(page, "Ideas");

            await expect(toasts(page)).toHaveCount(1);
            await expect(toasts(page).first()).toContainText(
                COLLISION("Ideas.md"),
            );
            await expect(sidebar(page).getByRole("status")).toHaveCount(0);
            expect(await listFiles(page)).toEqual(before);
            await advanceClock(page, TOAST_DURATION_MS + 1000);
            await expect(toasts(page)).toHaveCount(0);
        },
    );

    test(
        "closes the Rename dialog and shows an already-exists toast when the name was taken after validation",
        { tag: "@TOASTS-002" },
        async ({ page }) => {
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
        },
    );

    test(
        "keeps the invalid-name message inline in the open Rename dialog and shows no toast",
        { tag: "@TOASTS-003" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "alpha.md": "1" });
            await startRename(page, "alpha");

            await page.getByRole("textbox", { name: "Name" }).fill("a/b");

            await expect(
                page.getByRole("dialog").getByText("A name cannot contain"),
            ).toBeVisible();
            await expect(toasts(page)).toHaveCount(0);
        },
    );
});

test.describe("a toast names its kind", () => {
    test(
        "labels a collision toast Warning with an icon and a countdown line",
        { tag: "@TOASTS-004" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await collide(page, "Ideas");

            const toast = toasts(page).first();
            await expect(toast).toHaveAttribute("data-kind", "warning");
            await expect(toast).toContainText("Warning");
            await expect(toast.locator("svg").first()).toBeVisible();
            await expect(toast.getByTestId("toast-timer")).toBeAttached();
        },
    );
});

test.describe("stacking and dismissal (AC-08.2, AC-08.6)", () => {
    test(
        "shows at most three toasts with the newest last and removes one when its Dismiss button is used after four collisions",
        { tag: "@TOASTS-005" },
        async ({ page }) => {
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
        },
    );

    test(
        "keeps a toast visible while the pointer is on it past the auto-dismiss time and removes it after the pointer leaves",
        { tag: "@TOASTS-006" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await freezeClock(page);
            await collide(page, "Ideas");
            await expect(toasts(page)).toHaveCount(1);

            await toasts(page).first().hover();
            await advanceClock(page, TOAST_DURATION_MS + 1500);

            await expect(toasts(page)).toHaveCount(1);
            await page.mouse.move(0, 0);
            await advanceClock(page, TOAST_DURATION_MS + 1000);
            await expect(toasts(page)).toHaveCount(0);
        },
    );

    test(
        "dismisses the toast when Escape is pressed with the toast focused",
        { tag: "@TOASTS-007" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await collide(page, "Ideas");
            await expect(toasts(page)).toHaveCount(1);

            await toasts(page).first().focus();
            await page.keyboard.press("Escape");

            await expect(toasts(page)).toHaveCount(0);
        },
    );
});

test.describe("accessibility (AC-08.4, AC-08.5)", () => {
    test(
        "announces the toast through the notifications region and keeps focus on the previously focused row",
        { tag: "@TOASTS-008" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").focus();

            await collide(page, "Ideas");

            await expect(toasts(page)).toHaveCount(1);
            await expect(
                page.getByRole("status").filter({ hasText: "Notifications" }),
            ).toHaveCount(1);
            await expect(row(page, "Ideas")).toBeFocused();
        },
    );

    test(
        "shows the toast with no animation and no transition when reduced motion is preferred",
        { tag: "@TOASTS-009" },
        async ({ page }) => {
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
        },
    );
});

test.describe("what stays persistent (AC-08.3)", () => {
    test(
        "shows the read-only message in the sidebar and no toast when a note is moved in a read-only workspace",
        { tag: "@TOASTS-010" },
        async ({ page }) => {
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
        },
    );

    test(
        "opens the Save-failed dialog and shows no toast when a dirty note is closed and the save fails",
        { tag: "@TOASTS-011" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
            await row(page, "a").click();
            await page.getByRole("textbox", { name: "a" }).click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type("typed");
            await failNextWrite(page);

            await page.getByRole("button", { name: "Close a" }).click();

            await expect(page.getByRole("alertdialog")).toBeVisible();
            await expect(toasts(page)).toHaveCount(0);
        },
    );
});

test.describe("partial failures (AC-08.7)", () => {
    test(
        "moves the note, keeps its bytes and shows a links-not-updated toast when its links cannot be rewritten",
        { tag: "@TOASTS-012" },
        async ({ page }) => {
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
        },
    );
});
