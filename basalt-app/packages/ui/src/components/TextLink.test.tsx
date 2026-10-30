import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextLink } from "./TextLink";

describe("TextLink", () => {
    it("renders a link with its destination", () => {
        render(<TextLink href="/settings">Open settings</TextLink>);

        expect(
            screen
                .getByRole("link", { name: "Open settings" })
                .getAttribute("href"),
        ).toBe("/settings");
    });

    it("underlines inline links so they do not rely on color alone", () => {
        render(<TextLink href="/a">Inline</TextLink>);

        expect(screen.getByRole("link").className).toMatch(/(^|\s)underline(\s|$)/);
    });

    it("underlines standalone links only on hover", () => {
        render(
            <TextLink href="/a" variant="standalone">
                Standalone
            </TextLink>,
        );

        const className = screen.getByRole("link").className;
        expect(className).not.toMatch(/(^|\s)underline(\s|$)/);
        expect(className).toContain("hover:underline");
    });

    it("renders the child element when used as a slot", () => {
        render(
            <TextLink asChild>
                <button type="button">Router link</button>
            </TextLink>,
        );

        expect(screen.getByRole("button", { name: "Router link" })).toBeTruthy();
    });
});
