import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "../lib/utils";

type RadioOption = {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
};

type RadioGroupProps = {
    legend: ReactNode;
    options: RadioOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    name?: string;
    disabled?: boolean;
    "aria-invalid"?: boolean;
    className?: string;
};

function RadioGroup({
    legend,
    options,
    className,
    "aria-invalid": invalid,
    ...props
}: RadioGroupProps) {
    const legendId = useId();

    return (
        <div className={cn("bs-radio-group flex flex-col gap-in-group", className)}>
            <p id={legendId} className="font-ui-strong text-size-ui text-text-ui">
                {legend}
            </p>
            <RadioGroupPrimitive.Root
                aria-labelledby={legendId}
                aria-invalid={invalid}
                className="flex flex-col"
                {...props}
            >
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="inline-flex min-h-icon-button items-start gap-between-groups py-in-group text-size-ui text-text-ui has-disabled:cursor-not-allowed has-disabled:text-text-muted"
                    >
                        <RadioGroupPrimitive.Item
                            value={option.value}
                            disabled={option.disabled}
                            className="bs-radio flex size-icon shrink-0 items-center justify-center rounded-switch border border-border-control bg-surface-frame motion-feedback hover:border-text-muted focus-visible:focus-ring group-aria-invalid:border-status-danger disabled:cursor-not-allowed disabled:bg-state-hover data-[state=checked]:border-action-primary data-[state=checked]:bg-action-primary data-[state=checked]:hover:bg-action-primary-hover"
                        >
                            <RadioGroupPrimitive.Indicator className="block size-in-group rounded-switch bg-text-on-accent" />
                        </RadioGroupPrimitive.Item>
                        <span className="flex flex-col gap-in-group">
                            {option.label}
                            {option.description ? (
                                <span className="text-size-ui-small text-text-muted">
                                    {option.description}
                                </span>
                            ) : null}
                        </span>
                    </label>
                ))}
            </RadioGroupPrimitive.Root>
        </div>
    );
}

export { RadioGroup };
export type { RadioGroupProps, RadioOption };
