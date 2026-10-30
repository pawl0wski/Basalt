import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";
import { Select } from "./Select";

const options = (
    <>
        <option value="system">System</option>
        <option value="small">Small</option>
    </>
);

describe("Select", () => {
    it("is a combobox named by its Field label", () => {
        render(
            <Field label="Text size">
                <Select>{options}</Select>
            </Field>,
        );

        expect(
            screen.getByRole("combobox", { name: "Text size" }),
        ).toBeTruthy();
    });

    it("reports the chosen option", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <Select aria-label="Text size" onChange={onChange}>
                {options}
            </Select>,
        );
        await user.selectOptions(screen.getByRole("combobox"), "small");

        expect(onChange).toHaveBeenCalledOnce();
        expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
            "small",
        );
    });

    it("exposes a Field error to assistive technology", () => {
        render(
            <Field label="Text size" error="Choose a text size.">
                <Select>{options}</Select>
            </Field>,
        );

        const select = screen.getByRole("combobox", { name: "Text size" });
        expect(select.getAttribute("aria-invalid")).toBe("true");
        expect(select.getAttribute("aria-describedby")).toBeTruthy();
    });

    it("does not change while disabled", async () => {
        const user = userEvent.setup();

        render(
            <Select aria-label="Text size" disabled>
                {options}
            </Select>,
        );
        await user
            .selectOptions(screen.getByRole("combobox"), "small")
            .catch(() => undefined);

        expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
            "system",
        );
    });
});
