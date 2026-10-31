import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";

type CheckboxProps = Omit<
    ComponentProps<typeof CheckboxPrimitive.Root>,
    "children"
> & {
    label: ReactNode;
};

function Checkbox({ label, className, ...props }: CheckboxProps) {
    return (
        <label className="bs-checkbox-row inline-flex min-h-icon-button items-center gap-between-groups text-size-ui text-text-ui has-disabled:cursor-not-allowed has-disabled:text-text-muted">
            <CheckboxPrimitive.Root
                className={cn(
                    "bs-checkbox flex size-icon shrink-0 items-center justify-center rounded-control border border-border-control bg-surface-frame text-text-on-accent motion-feedback hover:border-text-muted focus-visible:focus-ring aria-invalid:border-status-danger disabled:cursor-not-allowed disabled:bg-state-hover data-[state=checked]:border-action-primary data-[state=checked]:bg-action-primary data-[state=checked]:hover:bg-action-primary-hover",
                    className,
                )}
                {...props}
            >
                <CheckboxPrimitive.Indicator className="flex size-full items-center justify-center">
                    <Check aria-hidden="true" className="size-full" />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
            {label}
        </label>
    );
}

export { Checkbox };
export type { CheckboxProps };
