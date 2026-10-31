import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./buttonVariants";

type ButtonProps = ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    };

function Button({
    className,
    variant = "primary",
    size,
    asChild = false,
    type = "button",
    ...props
}: ButtonProps) {
    const Component = asChild ? Slot : "button";

    return (
        <Component
            data-variant={variant}
            type={asChild ? undefined : type}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button };
export type { ButtonProps };
