import "@testing-library/jest-dom/vitest";
import { ToastProvider } from "@basalt/ui";
import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { initI18n } from "../../i18n";
import { ServicesProvider } from "../../ServicesProvider";
import { createHarness } from "../test-harness";
import { FeedbackBridge } from "./FeedbackBridge";
import { report } from "./feedback-store";

function renderBridge(harness: ReturnType<typeof createHarness>) {
    return render(
        <StrictMode>
            <ServicesProvider services={harness}>
                <ToastProvider>
                    <FeedbackBridge />
                </ToastProvider>
            </ServicesProvider>
        </StrictMode>,
    );
}

describe("FeedbackBridge", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("shows each reported error once as a translated toast and drains the store", async () => {
        const harness = createHarness({ workspaces: {} });
        renderBridge(harness);

        act(() => {
            report(harness.feedbackStore, {
                code: "already-exists",
                message: "English",
                detail: { kind: "move-collision", name: "Plan.md" },
            });
        });

        const region = await screen.findByRole("region", {
            name: /Notifications/,
        });
        expect(region).toHaveTextContent(
            '"Plan.md" already exists in the destination. Nothing was moved.',
        );
        expect(region.querySelectorAll("li")).toHaveLength(1);
        expect(harness.feedbackStore.getState().messages).toEqual([]);
    });

    it("stacks several errors reported together in order", async () => {
        const harness = createHarness({ workspaces: {} });
        renderBridge(harness);

        act(() => {
            report(harness.feedbackStore, { code: "not-found", message: "a" });
            report(harness.feedbackStore, {
                code: "invalid-path",
                message: "b",
            });
        });

        const region = await screen.findByRole("region", {
            name: /Notifications/,
        });
        const items = region.querySelectorAll("li");
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent("could not be found");
        expect(items[1]).toHaveTextContent("not valid");
    });
});
