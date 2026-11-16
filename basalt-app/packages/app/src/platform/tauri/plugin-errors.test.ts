import { describe, expect, it } from "vitest";
import { attempt, mapPluginError } from "./plugin-errors";

describe("mapPluginError", () => {
    it.each([
        ["No such file or directory (os error 2)", "not-found"],
        [
            "The system cannot find the file specified. (os error 2)",
            "not-found",
        ],
        [
            "The system cannot find the path specified. (os error 3)",
            "not-found",
        ],
        ["Permission denied (os error 13)", "permission-denied"],
        ["Access is denied. (os error 5)", "permission-denied"],
        [
            "forbidden path: C:\\Users\\me\\notes\\attachments, maybe it is not allowed on the scope for `allow-read-dir` permission in your capability file",
            "scope-denied",
        ],
        [
            "forbidden path: /home/me/notes/attachments/a.png, maybe it is not allowed on the scope for `allow-write-file` permission in your capability file",
            "scope-denied",
        ],
        [
            "forbidden path: /home/me/not found/attachments, maybe it is not allowed on the scope for `allow-read-dir` permission",
            "scope-denied",
        ],
        [
            "forbidden path: C:\\no such file\\os error 2\\attachments, maybe it is not allowed on the scope",
            "scope-denied",
        ],
        ["path not allowed on the configured scope: /x", "unknown"],
        ["File exists (os error 17)", "already-exists"],
        [
            "Cannot create a file when that file already exists. (os error 183)",
            "already-exists",
        ],
        ["Is a directory (os error 21)", "invalid-path"],
        ["No space left on device (os error 28)", "unknown"],
        ["something unexpected", "unknown"],
    ])("maps %j to %s", (raw, code) => {
        expect(mapPluginError(raw).code).toBe(code);
    });

    it("reads the message of an Error", () => {
        expect(mapPluginError(new Error("Permission denied")).code).toBe(
            "permission-denied",
        );
    });

    it("maps non-string, non-Error values to unknown", () => {
        expect(mapPluginError({ code: 2 }).code).toBe("unknown");
        expect(mapPluginError(undefined).code).toBe("unknown");
    });

    it("never echoes the raw text, which may contain paths or content", () => {
        const secret = "/home/me/private-note.md: secret body";
        for (const raw of [
            `No such file or directory (os error 2): ${secret}`,
            `Permission denied: ${secret}`,
            `File exists: ${secret}`,
            secret,
        ]) {
            const mapped = mapPluginError(raw);
            expect(mapped.message).not.toContain("secret");
            expect(mapped.message).not.toContain("/home/me");
        }
    });
});

describe("attempt", () => {
    it("wraps a resolved value", async () => {
        expect(await attempt(async () => 3)).toEqual({ ok: true, value: 3 });
    });

    it("maps a rejection to an AppError", async () => {
        const result = await attempt(() =>
            Promise.reject("Permission denied (os error 13)"),
        );

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("permission-denied");
    });
});
