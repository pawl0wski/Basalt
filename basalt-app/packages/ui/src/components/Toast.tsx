import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import type { ToastOptions } from "./toastContext";
import { ToastContext } from "./toastContext";

type ToastItem = ToastOptions & { id: number };

function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((options: ToastOptions) => {
        setToasts((current) => [...current, { ...options, id: Date.now() + current.length }]);
    }, []);

    const remove = (id: number) => setToasts((current) => current.filter((item) => item.id !== id));

    return (
        <ToastContext.Provider value={toast}>
            <ToastPrimitive.Provider duration={5000} label="Notifications">
                {children}
                {toasts.map((item) => (
                    <ToastPrimitive.Root
                        key={item.id}
                        duration={item.duration}
                        onOpenChange={(open) => {
                            if (!open) remove(item.id);
                        }}
                        className="bs-toast flex items-start justify-between gap-between-groups rounded-container border border-border-divider bg-surface-raised p-panel text-size-ui text-text-ui"
                    >
                        <div className="flex flex-col gap-in-group">
                            <ToastPrimitive.Title className="font-ui-strong">
                                {item.title}
                            </ToastPrimitive.Title>
                            {item.description ? (
                                <ToastPrimitive.Description className="text-size-ui-small text-text-muted">
                                    {item.description}
                                </ToastPrimitive.Description>
                            ) : null}
                            {item.action ? (
                                <ToastPrimitive.Action altText={item.action.label} asChild>
                                    <Button variant="secondary" onClick={item.action.onClick}>
                                        {item.action.label}
                                    </Button>
                                </ToastPrimitive.Action>
                            ) : null}
                        </div>
                        <ToastPrimitive.Close asChild>
                            <IconButton aria-label="Dismiss" tooltip={false}>
                                <X aria-hidden="true" />
                            </IconButton>
                        </ToastPrimitive.Close>
                    </ToastPrimitive.Root>
                ))}
                <ToastPrimitive.Viewport className="fixed inset-x-panel bottom-panel m-none flex list-none flex-col gap-in-group p-none tablet:left-auto tablet:w-sidebar" />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
}

export { ToastProvider };
