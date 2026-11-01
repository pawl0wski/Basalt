import { describe, expect, it } from "vitest";
import { suggestNoteName, validateName } from "./names";

describe("validateName", () => {
    it("rejects an empty name", () => {
        expect(validateName("   ", [], "note")).toBe(
            "Enter a name for the note.",
        );
    });

    it("rejects a case-only collision", () => {
        expect(validateName("weekly plan", ["Weekly plan"], "note")).toBe(
            "A note with this name already exists.",
        );
    });

    it("rejects a Unicode-form-only collision", () => {
        const decomposed = "Résumé ideas";
        expect(validateName(decomposed, ["Résumé ideas"], "note")).toBe(
            "A note with this name already exists.",
        );
    });

    it("rejects invalid characters, reserved names and long names", () => {
        expect(validateName("a/b", [], "note")).toMatch(/cannot contain/);
        expect(validateName("CON", [], "note")).toMatch(/reserved/);
        expect(validateName("é".repeat(128), [], "note")).toMatch(/255 bytes/);
        expect(validateName("name.", [], "note")).toMatch(/cannot end/);
    });

    it("accepts a free name", () => {
        expect(validateName("Plan B", ["Plan A"], "note")).toBeUndefined();
    });
});

describe("suggestNoteName", () => {
    it("suggests Untitled, then the first free number", () => {
        expect(suggestNoteName([])).toBe("Untitled");
        expect(suggestNoteName(["Untitled"])).toBe("Untitled 1");
        expect(suggestNoteName(["untitled", "Untitled 1"])).toBe("Untitled 2");
    });
});
