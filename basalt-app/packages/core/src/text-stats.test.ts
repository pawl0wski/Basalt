import { describe, expect, it } from "vitest";
import { countWords } from "./text-stats";

describe("countWords", () => {
    it("is 0 for empty and whitespace-only text", () => {
        expect(countWords("")).toBe(0);
        expect(countWords("   \n\t \r\n ")).toBe(0);
    });

    it("counts whitespace-separated words across spaces, tabs, LF and CRLF", () => {
        expect(countWords("one two\tthree\nfour\r\nfive   six")).toBe(6);
    });

    it("ignores leading and trailing whitespace", () => {
        expect(countWords("  \n hello world \n ")).toBe(2);
    });

    it("does not count bare Markdown markers as words", () => {
        expect(countWords("# ")).toBe(0);
        expect(countWords("- \n> \n* \n+ \n---\n***\n___\n```\n|")).toBe(0);
        expect(countWords("1. ")).toBe(1);
    });

    it("counts the words next to markers once each", () => {
        expect(countWords("# Heading")).toBe(1);
        expect(countWords("## Two words")).toBe(2);
        expect(countWords("- item one\n- item two")).toBe(4);
        expect(countWords("> quoted text")).toBe(2);
        expect(countWords("- [ ] task")).toBe(1);
    });

    it("counts a token with inline markers as one word", () => {
        expect(countWords("**bold** _it_ `code` ~~gone~~")).toBe(4);
        expect(countWords("[link](https://example.com/a)")).toBe(1);
        expect(countWords("![alt](image.png)")).toBe(1);
    });

    it("counts tokens made of digits and non-Latin letters", () => {
        expect(countWords("2026 zażółć łódź привет")).toBe(4);
    });

    it("does not count punctuation-only and emoji-only tokens", () => {
        expect(countWords("... !!! — 🙂")).toBe(0);
    });

    it("handles a 5 MiB note", () => {
        const text = "word ".repeat(1_048_576);

        expect(countWords(text)).toBe(1_048_576);
    });
});
