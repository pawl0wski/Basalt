import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
    it("is a single-line text field by default", () => {
        render(<Input aria-label="Note title" />);

        expect(
            screen
                .getByRole("textbox", { name: "Note title" })
                .getAttribute("type"),
        ).toBe("text");
    });

    it("reports typed text", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<Input aria-label="Note title" onChange={onChange} />);
        await user.type(screen.getByRole("textbox"), "Plan");

        expect(onChange).toHaveBeenCalledTimes(4);
        expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
            "Plan",
        );
    });

    it("does not accept text while disabled", async () => {
        const user = userEvent.setup();

        render(<Input aria-label="Note title" disabled />);
        await user.type(screen.getByRole("textbox"), "Plan");

        expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
            "",
        );
    });

    it("exposes the invalid state to assistive technology", () => {
        render(<Input aria-label="Note title" aria-invalid="true" />);

        expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe(
            "true",
        );
    });
});
