import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardRow } from "./Card";

describe("Card", () => {
    it("names its region by the heading", () => {
        render(
            <Card heading="Status bar">
                <CardRow title="Show word count" />
            </Card>,
        );

        expect(screen.getByRole("region", { name: "Status bar" })).toBeTruthy();
        expect(
            screen.getByRole("heading", { level: 2, name: "Status bar" }),
        ).toBeTruthy();
    });

    it("uses the requested heading level", () => {
        render(
            <Card heading="Status bar" headingAs="h3">
                <CardRow title="Show word count" />
            </Card>,
        );

        expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
    });

    it("has no region name without a heading", () => {
        render(
            <Card>
                <CardRow title="Show word count" />
            </Card>,
        );

        expect(screen.queryByRole("region")).toBeNull();
    });

    it("renders the title, the description and the control of a row", () => {
        render(
            <Card>
                <CardRow title="Sync" description="Keeps notes in step.">
                    <button type="button">Choose</button>
                </CardRow>
            </Card>,
        );

        expect(screen.getByText("Sync")).toBeTruthy();
        expect(screen.getByText("Keeps notes in step.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Choose" })).toBeTruthy();
    });
});
