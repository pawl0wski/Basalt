import { describe, expect, it } from "vitest";
import {
    APP_ERROR_CODES,
    err,
    mapError,
    ok,
    type AppError,
    type Result,
} from "./index";

function describeCode(error: AppError): string {
    switch (error.code) {
        case "not-found":
        case "permission-denied":
        case "scope-denied":
        case "already-exists":
        case "invalid-path":
        case "not-a-file":
        case "conflict":
        case "too-large":
        case "not-utf8":
        case "unsupported":
        case "unavailable":
        case "unknown":
            return error.code;
        default: {
            const unreachable: never = error;
            return unreachable;
        }
    }
}

describe("AppError", () => {
    it("exposes the stable set of codes", () => {
        expect([...APP_ERROR_CODES]).toEqual([
            "not-found",
            "permission-denied",
            "scope-denied",
            "already-exists",
            "invalid-path",
            "not-a-file",
            "conflict",
            "too-large",
            "not-utf8",
            "unsupported",
            "unavailable",
            "unknown",
        ]);
    });

    it("is handled exhaustively for every code", () => {
        const handled = APP_ERROR_CODES.map((code) =>
            describeCode({ code, message: "m" }),
        );

        expect(handled).toEqual([...APP_ERROR_CODES]);
    });
});

describe("ok and err", () => {
    it("ok wraps a value, including falsy ones", () => {
        expect(ok(0)).toEqual({ ok: true, value: 0 });
        expect(ok(null)).toEqual({ ok: true, value: null });
    });

    it("err wraps the error without a value", () => {
        const result = err({ code: "not-found", message: "missing" });

        expect(result).toEqual({
            ok: false,
            error: { code: "not-found", message: "missing" },
        });
        expect("value" in result).toBe(false);
    });

    it("narrows on the ok flag", () => {
        const result: Result<string> = ok("text");

        if (result.ok) {
            expect(result.value).toBe("text");
        } else {
            expect.unreachable();
        }
    });
});

describe("mapError", () => {
    it("transforms the error of a failed result", () => {
        const result = mapError(
            err<string>({ code: "unknown", message: "raw" }),
            (error) => ({ code: "unavailable", message: error.message }),
        );

        expect(result).toEqual({
            ok: false,
            error: { code: "unavailable", message: "raw" },
        });
    });

    it("returns a successful result untouched without calling the mapper", () => {
        const success = ok(42);
        let calls = 0;

        const result = mapError(success, (error) => {
            calls += 1;
            return error;
        });

        expect(result).toBe(success);
        expect(calls).toBe(0);
    });
});
