import type { ReactNode } from "react";
import { ServicesContext } from "./ServicesContext";
import type { Services } from "./services";

export function ServicesProvider({
    services,
    children,
}: {
    services: Services;
    children: ReactNode;
}) {
    return <ServicesContext value={services}>{children}</ServicesContext>;
}
