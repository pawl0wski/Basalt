import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { cn } from "../lib/utils";

type SwitchProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "role" | "onChange" | "value"
> & {
    label?: ReactNode;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

function Switch({
    label,
    checked,
    defaultChecked = false,
    onCheckedChange,
    className,
    onClick,
    type = "button",
    ...props
}: SwitchProps) {
    const [internal, setInternal] = useState(defaultChecked);
    const value = checked ?? internal;
    const state = value ? "checked" : "unchecked";

    return (
        <label className="bs-switch-row inline-flex min-h-icon-button items-center gap-between-groups text-size-ui text-text-ui has-disabled:cursor-not-allowed has-disabled:text-text-muted">
            <button
                role="switch"
                type={type}
                aria-checked={value}
                data-state={state}
                className={cn(
                    "bs-switch inline-flex h-activity-icon w-activity-button shrink-0 items-center rounded-switch bg-border-control p-tab-indicator motion-feedback focus-visible:focus-ring disabled:cursor-not-allowed disabled:bg-state-selected data-[state=checked]:bg-action-primary data-[state=checked]:hover:bg-action-primary-hover",
                    className,
                )}
                onClick={(event) => {
                    onClick?.(event);
                    if (event.defaultPrevented) return;
                    if (checked === undefined) setInternal(!value);
                    onCheckedChange?.(!value);
                }}
                {...props}
            >
                <span
                    aria-hidden="true"
                    data-state={state}
                    className="pointer-events-none block size-icon rounded-switch bg-text-on-accent motion-panel data-[state=checked]:translate-x-icon"
                />
            </button>
            {label}
        </label>
    );
}

export { Switch };
export type { SwitchProps };
