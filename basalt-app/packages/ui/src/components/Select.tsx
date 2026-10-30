import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";
import { useFieldControl } from "./fieldContext";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function Select({ className, children, ...props }: SelectProps) {
    const field = useFieldControl();

    return (
        <div className="relative flex w-full items-center">
            <select
                className={cn(
                    "bs-select h-icon-button w-full appearance-none rounded-control border border-border-control bg-surface-frame pl-between-groups pr-section text-size-ui text-text-ui motion-feedback focus-visible:focus-ring aria-invalid:border-status-danger disabled:cursor-not-allowed disabled:bg-state-hover disabled:text-text-muted",
                    className,
                )}
                {...field}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-between-groups size-icon text-icon-default"
            />
        </div>
    );
}

export { Select };
export type { SelectProps };
