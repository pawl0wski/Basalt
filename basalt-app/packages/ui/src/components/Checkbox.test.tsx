import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
    it("is named by its label and starts unchecked", () => {
        render(<Checkbox label="Show word count" />);

        expect(
            screen
                .getByRole("checkbox", { name: "Show word count" })
                .getAttribute("aria-checked"),
        ).toBe("false");
    });

    it("toggles from a click on the control and on the label text", async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(<Checkbox label="Show word count" onCheckedChange={onCheckedChange} />);
        await user.click(screen.getByRole("checkbox"));
        await user.click(screen.getByText("Show word count"));

        expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
        expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
    });

    it("toggles with the space key", async () => {
        const user = userEvent.setup();

        render(<Checkbox label="Show word count" />);
        await user.tab();
        await user.keyboard(" ");

        expect(
            screen.getByRole("checkbox").getAttribute("aria-checked"),
        ).toBe("true");
    });

    it("does not toggle while disabled", async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(
            <Checkbox label="Show word count" disabled onCheckedChange={onCheckedChange} />,
        );
        await user.click(screen.getByRole("checkbox"));
        await user.click(screen.getByText("Show word count"));

        expect(onCheckedChange).not.toHaveBeenCalled();
    });
});
