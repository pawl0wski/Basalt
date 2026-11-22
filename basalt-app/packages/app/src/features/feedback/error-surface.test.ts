import { APP_ERROR_CODES, type AppError } from "@basalt/core";
import { describe, expect, it } from "vitest";
import { errorSurface, toastKind } from "./error-surface";

function error(code: AppError["code"], detail?: AppError["detail"]): AppError {
    return { code, message: "x", detail };
}

describe("errorSurface", () => {
    it.each(["already-exists", "not-found", "invalid-path"] as const)(
        "shows %s as a toast",
        (code) => {
            expect(errorSurface(error(code))).toBe("toast");
        },
    );

    it.each([
        "permission-denied",
        "scope-denied",
        "unavailable",
        "unknown",
        "conflict",
        "too-large",
        "not-utf8",
        "not-a-file",
        "unsupported",
    ] as const)("keeps %s persistent", (code) => {
        expect(errorSurface(error(code))).toBe("persistent");
    });

    it("classifies every error code", () => {
        for (const code of APP_ERROR_CODES) {
            expect(["toast", "persistent"]).toContain(
                errorSurface(error(code)),
            );
        }
    });

    it("lets a partial-failure detail win over a persistent code", () => {
        expect(
            errorSurface(
                error("permission-denied", {
                    kind: "move-stopped",
                    name: "a.md",
                    moved: 1,
                    total: 2,
                    linksOnly: false,
                }),
            ),
        ).toBe("toast");
        expect(
            errorSurface(
                error("unknown", {
                    kind: "delete-failed",
                    failed: 1,
                    total: 2,
                }),
            ),
        ).toBe("toast");
        expect(
            errorSurface(
                error("already-exists", {
                    kind: "move-collision",
                    name: "a.md",
                }),
            ),
        ).toBe("toast");
    });
});

describe("toastKind", () => {
    it("warns when nothing changed because of a name collision", () => {
        expect(
            toastKind(
                error("already-exists", { kind: "move-collision", name: "a" }),
            ),
        ).toBe("warning");
    });

    it.each(["already-exists", "not-found", "invalid-path"] as const)(
        "warns for %s without detail",
        (code) => {
            expect(toastKind(error(code))).toBe("warning");
        },
    );

    it("reports a stopped move or failed delete as an error even with a warning code", () => {
        expect(
            toastKind(
                error("not-found", {
                    kind: "delete-failed",
                    failed: 1,
                    total: 2,
                }),
            ),
        ).toBe("danger");
    });

    it("reports codes outside the warning set as an error", () => {
        expect(toastKind(error("unknown"))).toBe("danger");
    });
});
