import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";

describe("Field", () => {
    it("connects the label to the control", () => {
        render(
            <Field label="Note title">
                <Input />
            </Field>,
        );

        expect(screen.getByLabelText("Note title")).toBe(
            screen.getByRole("textbox"),
        );
    });

    it("describes the control with the hint", () => {
        render(
            <Field label="Workspace name" hint="Shown in the window title.">
                <Input />
            </Field>,
        );

        expect(
            screen.getByRole("textbox", {
                description: "Shown in the window title.",
            }),
        ).toBeTruthy();
    });

    it("marks the control invalid and describes it with the error and the hint", () => {
        render(
            <Field
                label="Workspace name"
                hint="Shown in the window title."
                error="Enter a name for the workspace."
            >
                <Input />
            </Field>,
        );

        const input = screen.getByRole("textbox", { name: "Workspace name" });
        expect(input.getAttribute("aria-invalid")).toBe("true");
        expect(
            screen.getByRole("textbox", {
                description:
                    "Shown in the window title. Enter a name for the workspace.",
            }),
        ).toBe(input);
    });

    it("leaves a valid control without aria-invalid", () => {
        render(
            <Field label="Workspace name">
                <Input />
            </Field>,
        );

        expect(screen.getByRole("textbox").hasAttribute("aria-invalid")).toBe(false);
    });

    it("tells assistive technology that a field is required and shows optional ones", () => {
        render(
            <>
                <Field label="Workspace name" required>
                    <Input />
                </Field>
                <Field label="Description" optional>
                    <Input />
                </Field>
            </>,
        );

        expect(
            screen
                .getByRole("textbox", { name: "Workspace name" })
                .getAttribute("aria-required"),
        ).toBe("true");
        expect(screen.getByLabelText(/Description/).hasAttribute("aria-required")).toBe(false);
        expect(screen.getByText("(optional)")).toBeTruthy();
    });

    it("gives every field its own ids", () => {
        render(
            <>
                <Field label="First">
                    <Input />
                </Field>
                <Field label="Second">
                    <Input />
                </Field>
            </>,
        );

        const [first, second] = screen.getAllByRole("textbox");
        expect(first.id).not.toBe(second.id);
    });
});
