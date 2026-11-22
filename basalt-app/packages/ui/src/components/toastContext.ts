import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type ToastKind = "info" | "warning" | "danger";

export type ToastOptions = {
    kind?: ToastKind;
    title: ReactNode;
    description?: ReactNode;
    action?: { label: string; onClick: () => void };
    duration?: number;
};

export const ToastContext = createContext<
    ((options: ToastOptions) => void) | null
>(null);

export function useToast() {
    const toast = useContext(ToastContext);
    if (!toast) throw new Error("useToast must be used inside ToastProvider");
    return toast;
}
