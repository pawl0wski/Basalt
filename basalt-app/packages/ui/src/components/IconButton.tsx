import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Tooltip } from "./Tooltip";

const iconButtonVariants = cva(
    "bs-icon-button inline-flex shrink-0 items-center justify-center rounded-control text-icon-default motion-feedback hover:text-icon-active focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-text-muted data-[active]:text-icon-active [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                ghost: "hover:bg-state-hover",
                secondary:
                    "border border-border-divider bg-button-secondary-bg hover:bg-state-selected",
            },
            size: {
                default: "size-icon-button [&_svg]:size-icon",
                activity: "size-activity-button [&_svg]:size-activity-icon",
            },
        },
        defaultVariants: { variant: "ghost", size: "default" },
    },
);

type IconButtonProps = Omit<
    ComponentProps<"button">,
    "aria-label" | "children"
> &
    VariantProps<typeof iconButtonVariants> & {
        "aria-label": string;
        children: ReactNode;
        tooltip?: ReactNode | false;
        active?: boolean;
    };

function IconButton({
    className,
    variant = "ghost",
    size = "default",
    active = false,
    type = "button",
    tooltip,
    "aria-label": ariaLabel,
    ...props
}: IconButtonProps) {
    const button = (
        <button
            data-variant={variant}
            data-active={active ? "" : undefined}
            type={type}
            aria-label={ariaLabel}
            className={cn(iconButtonVariants({ variant, size, className }))}
            {...props}
        />
    );

    if (tooltip === false) return button;

    return <Tooltip content={tooltip ?? ariaLabel}>{button}</Tooltip>;
}

export { IconButton };
export type { IconButtonProps };
