import type { ReactNode } from "react";

export function Collapsible({
    open,
    side,
    children,
}: {
    open: boolean;
    side: "left" | "right";
    children: ReactNode;
}) {
    return (
        <div
            data-open={open}
            data-side={side}
            inert={!open}
            className="proto-collapsible h-full overflow-hidden"
        >
            <div className="h-full w-sidebar">{children}</div>
        </div>
    );
}
