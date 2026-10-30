import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Tooltip } from "./Tooltip";

const iconButtonVariants = cva(
    "bs-icon-button inline-flex size-icon-button shrink-0 items-center justify-center rounded-control text-icon-default motion-feedback hover:text-icon-active focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-text-muted [&_svg]:pointer-events-none [&_svg]:size-icon [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                ghost: "hover:bg-state-hover",
                secondary:
                    "border border-border-divider bg-button-secondary-bg hover:bg-state-selected",
            },
        },
        defaultVariants: { variant: "ghost" },
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
    };

function IconButton({
    className,
    variant = "ghost",
    type = "button",
    tooltip,
    "aria-label": ariaLabel,
    ...props
}: IconButtonProps) {
    const button = (
        <button
            data-variant={variant}
            type={type}
            aria-label={ariaLabel}
            className={cn(iconButtonVariants({ variant, className }))}
            {...props}
        />
    );

    if (tooltip === false) return button;

    return <Tooltip content={tooltip ?? ariaLabel}>{button}</Tooltip>;
}

export { IconButton };
export type { IconButtonProps };
