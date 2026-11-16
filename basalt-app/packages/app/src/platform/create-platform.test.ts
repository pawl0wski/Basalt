import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlatform } from "./create-platform";

describe("createPlatform", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        delete window.__basaltTestFs;
    });

    it("selects the memory platform only when VITE_BASALT_PLATFORM=memory", async () => {
        vi.stubEnv("VITE_BASALT_PLATFORM", "memory");

        const platform = await createPlatform();

        expect(window.__basaltTestFs).toBeDefined();
        expect(await platform.picker.pickDirectory()).toEqual({
            ok: true,
            value: "/demo",
        });
    });

    it.each([undefined, "", "tauri", "Memory"])(
        "selects Tauri without a test handle for %j",
        async (value) => {
            vi.stubEnv("VITE_BASALT_PLATFORM", value as string);

            const platform = await createPlatform();

            expect(window.__basaltTestFs).toBeUndefined();
            expect(Object.keys(platform).sort()).toEqual([
                "access",
                "picker",
                "settings",
                "trash",
                "windowChrome",
            ]);
        },
    );
});
