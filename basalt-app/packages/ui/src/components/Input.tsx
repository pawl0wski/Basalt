import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "../lib/utils";
import { useFieldControl } from "./fieldContext";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>;
};

function Input({ className, type = "text", ...props }: InputProps) {
    const field = useFieldControl();

    return (
        <input
            type={type}
            className={cn(
                "bs-input h-icon-button w-full rounded-control border border-border-control bg-surface-frame px-between-groups text-size-ui text-text-ui placeholder:text-text-muted motion-feedback focus-visible:focus-ring aria-invalid:border-status-danger disabled:cursor-not-allowed disabled:bg-state-hover disabled:text-text-muted",
                className,
            )}
            {...field}
            {...props}
        />
    );
}

export { Input };
export type { InputProps };
