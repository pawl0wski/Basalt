import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import type { WindowChrome } from "../../platform/platform";
import { ServicesProvider } from "../../ServicesProvider";
import type { Services } from "../../services";
import { AppWindowContainer } from "./AppWindowContainer";

function setup() {
    const listeners = new Set<(maximized: boolean) => void>();
    const windowChrome: WindowChrome = {
        minimize: vi.fn(),
        toggleMaximize: vi.fn(),
        close: vi.fn(),
        destroy: vi.fn(),
        onCloseRequested: vi.fn(() => () => {}),
        subscribeMaximized: vi.fn((listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }),
    };
    const view = render(
        <ServicesProvider services={{ windowChrome } as Services}>
            <AppWindowContainer>
                <p>content</p>
            </AppWindowContainer>
        </ServicesProvider>,
    );
    return { windowChrome, listeners, ...view };
}

describe("AppWindowContainer", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("renders translated title and button names", () => {
        setup();

        expect(screen.getByText(en.window.title)).toBeInTheDocument();
        for (const name of [
            en.window.minimize,
            en.window.maximize,
            en.window.close,
        ]) {
            expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
    });

    it("forwards button clicks to the window chrome", async () => {
        const user = userEvent.setup();
        const { windowChrome } = setup();

        await user.click(
            screen.getByRole("button", { name: en.window.minimize }),
        );
        await user.click(
            screen.getByRole("button", { name: en.window.maximize }),
        );
        await user.click(screen.getByRole("button", { name: en.window.close }));

        expect(windowChrome.minimize).toHaveBeenCalledOnce();
        expect(windowChrome.toggleMaximize).toHaveBeenCalledOnce();
        expect(windowChrome.close).toHaveBeenCalledOnce();
    });

    it("follows the maximized state and unsubscribes on unmount", () => {
        const { listeners, unmount } = setup();

        act(() => {
            for (const listener of listeners) listener(true);
        });
        expect(
            screen.getByRole("button", { name: en.window.restore }),
        ).toBeInTheDocument();

        act(() => {
            for (const listener of listeners) listener(false);
        });
        expect(
            screen.getByRole("button", { name: en.window.maximize }),
        ).toBeInTheDocument();

        unmount();
        expect(listeners.size).toBe(0);
    });
});
