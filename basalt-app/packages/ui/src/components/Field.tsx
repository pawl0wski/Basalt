import type { LabelHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../lib/utils";
import { FieldContext } from "./fieldContext";

function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cn("bs-label text-size-ui text-text-ui", className)}
            {...props}
        />
    );
}

type FieldProps = {
    label: ReactNode;
    children: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    optional?: boolean;
    className?: string;
};

function Field({
    label,
    children,
    hint,
    error,
    required = false,
    optional = false,
    className,
}: FieldProps) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
        <FieldContext.Provider
            value={{
                id,
                "aria-describedby": describedBy,
                "aria-invalid": error ? true : undefined,
                "aria-required": required ? true : undefined,
            }}
        >
            <div
                className={cn("bs-field flex flex-col gap-in-group", className)}
            >
                <Label htmlFor={id}>
                    {label}
                    {optional ? (
                        <span className="text-text-muted"> (optional)</span>
                    ) : null}
                </Label>
                {children}
                {hint ? (
                    <p
                        id={hintId}
                        className="text-size-ui-small text-text-muted"
                    >
                        {hint}
                    </p>
                ) : null}
                {error ? (
                    <p
                        id={errorId}
                        className="text-size-ui-small text-status-danger"
                    >
                        {error}
                    </p>
                ) : null}
            </div>
        </FieldContext.Provider>
    );
}

export { Field, Label };
export type { FieldProps };
