import { cn } from "../lib/utils";

type SkeletonProps = {
    className?: string;
};

function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "bs-skeleton h-icon w-full rounded-control bg-state-hover",
                className,
            )}
        />
    );
}

export { Skeleton };
export type { SkeletonProps };
