import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "../lib/utils";

const textLinkVariants = cva(
    "bs-link rounded-control text-text-link motion-feedback hover:text-text-note focus-visible:focus-ring",
    {
        variants: {
            variant: {
                inline: "underline",
                standalone: "hover:underline",
            },
        },
        defaultVariants: { variant: "inline" },
    },
);

type TextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
    VariantProps<typeof textLinkVariants> & {
        asChild?: boolean;
    };

function TextLink({
    className,
    variant = "inline",
    asChild = false,
    ...props
}: TextLinkProps) {
    const Component = asChild ? Slot : "a";

    return (
        <Component
            data-variant={variant}
            className={cn(textLinkVariants({ variant, className }))}
            {...props}
        />
    );
}

export { TextLink };
export type { TextLinkProps };
