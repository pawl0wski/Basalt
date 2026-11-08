import { useContext } from "react";
import { ServicesContext } from "./ServicesContext";
import type { Services } from "./services";

export function useServices(): Services {
    const services = useContext(ServicesContext);
    if (!services) throw new Error("ServicesProvider is missing.");
    return services;
}
