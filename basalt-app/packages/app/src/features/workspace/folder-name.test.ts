import { describe, expect, it } from "vitest";
import { folderName } from "./folder-name";

describe("folderName", () => {
    it.each([
        ["/home/me/Basalt notes", "Basalt notes"],
        ["/demo", "demo"],
        ["/home/me/notes/", "notes"],
        ["C:\\Users\\me\\Notes", "Notes"],
        ["/", "/"],
    ])("takes the last segment of %s", (root, expected) => {
        expect(folderName(root)).toBe(expected);
    });
});
