import { cva } from "class-variance-authority";

const primary =
    "bg-action-primary text-text-on-accent hover:bg-action-primary-hover disabled:bg-state-hover disabled:text-text-muted";
const secondary =
    "border border-border-divider bg-button-secondary-bg text-text-ui hover:bg-state-selected disabled:bg-state-hover disabled:text-text-muted";

export const buttonVariants = cva(
    "bs-button inline-flex h-icon-button items-center justify-center gap-in-group whitespace-nowrap rounded-control px-between-groups text-size-ui font-normal motion-feedback focus-visible:focus-ring disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-icon [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary,
                secondary,
                ghost: "text-text-ui hover:bg-state-hover disabled:text-text-muted",
                destructive:
                    "text-status-danger hover:bg-state-hover disabled:text-text-muted",
                default: primary,
                outline: secondary,
            },
            size: {
                default: "",
                lg: "h-activity-button",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    },
);
