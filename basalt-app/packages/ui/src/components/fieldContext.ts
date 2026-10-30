import { createContext, useContext } from "react";

export type FieldControlProps = {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
    "aria-required": true | undefined;
};

export const FieldContext = createContext<FieldControlProps | null>(null);

export function useFieldControl(): Partial<FieldControlProps> {
    return useContext(FieldContext) ?? {};
}
