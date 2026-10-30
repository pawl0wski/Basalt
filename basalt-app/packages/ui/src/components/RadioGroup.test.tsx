import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "./RadioGroup";

const options = [
    { value: "system", label: "System default" },
    { value: "small", label: "Small", description: "12 px" },
    { value: "large", label: "Large", disabled: true },
];

describe("RadioGroup", () => {
    it("is a group named by its legend with one radio per option", () => {
        render(<RadioGroup legend="Text size" options={options} defaultValue="system" />);

        expect(screen.getByRole("radiogroup", { name: "Text size" })).toBeTruthy();
        expect(screen.getAllByRole("radio")).toHaveLength(3);
        expect(screen.getByRole("radio", { name: "System default" }).getAttribute("aria-checked")).toBe("true");
    });

    it("selects from a click on the control and on the label text", async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();

        render(<RadioGroup legend="Text size" options={options} defaultValue="system" onValueChange={onValueChange} />);
        await user.click(screen.getByText("Small"));

        expect(onValueChange).toHaveBeenCalledWith("small");
        expect(screen.getByRole("radio", { name: /Small/ }).getAttribute("aria-checked")).toBe("true");
    });

    it("moves focus with the arrow keys, keeps one tab stop and skips disabled options", async () => {
        const user = userEvent.setup();

        render(<RadioGroup legend="Text size" options={options} defaultValue="system" />);
        await user.tab();
        expect(document.activeElement).toBe(screen.getByRole("radio", { name: "System default" }));

        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(screen.getByRole("radio", { name: /Small/ }));

        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(screen.getByRole("radio", { name: "System default" }));
        expect(screen.getByRole("radio", { name: /Small/ }).getAttribute("tabindex")).toBe("-1");
    });

    it("does not select a disabled option", async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();

        render(<RadioGroup legend="Text size" options={options} defaultValue="system" onValueChange={onValueChange} />);
        await user.click(screen.getByText("Large"));

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it("includes the description in the accessible name of its option", () => {
        render(<RadioGroup legend="Text size" options={options} />);

        expect(screen.getByRole("radio", { name: "Small 12 px" })).toBeTruthy();
    });
});
