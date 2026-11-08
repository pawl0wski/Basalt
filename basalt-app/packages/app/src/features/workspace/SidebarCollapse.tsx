import type { ReactNode } from "react";

export type SidebarCollapseProps = {
    open: boolean;
    children: ReactNode;
};

export function SidebarCollapse({ open, children }: SidebarCollapseProps) {
    return (
        <div
            data-open={open}
            inert={!open}
            className="app-sidebar-collapse h-full overflow-hidden"
        >
            <div className="h-full w-sidebar">{children}</div>
        </div>
    );
}
