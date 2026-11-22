import * as ToastPrimitive from "@radix-ui/react-toast";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { cn } from "../lib/utils";
import type { ToastKind, ToastOptions } from "./toastContext";
import { ToastContext } from "./toastContext";

type ToastItem = ToastOptions & { id: number };

const kinds = {
    info: { Icon: Info, color: "text-icon-default", timer: "bg-icon-default" },
    warning: {
        Icon: TriangleAlert,
        color: "text-status-warning",
        timer: "bg-status-warning",
    },
    danger: {
        Icon: CircleAlert,
        color: "text-status-danger",
        timer: "bg-status-danger",
    },
} as const;

const DEFAULT_KIND_LABELS: Record<ToastKind, string> = {
    info: "Info",
    warning: "Warning",
    danger: "Error",
};

type ToastProviderProps = {
    children: ReactNode;
    label?: string;
    dismissLabel?: string;
    kindLabels?: Record<ToastKind, string>;
};

const DEFAULT_DURATION_MS = 5000;

const MAX_VISIBLE_TOASTS = 3;

function ToastProvider({
    children,
    label = "Notifications",
    dismissLabel = "Dismiss",
    kindLabels = DEFAULT_KIND_LABELS,
}: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const toast = useCallback((options: ToastOptions) => {
        nextId.current += 1;
        const item = { ...options, id: nextId.current };
        setToasts((current) => [...current, item].slice(-MAX_VISIBLE_TOASTS));
    }, []);

    const remove = (id: number) =>
        setToasts((current) => current.filter((item) => item.id !== id));

    return (
        <ToastContext.Provider value={toast}>
            <ToastPrimitive.Provider
                duration={DEFAULT_DURATION_MS}
                label={label}
            >
                {children}
                {toasts.map((item) => {
                    const kind = item.kind ?? "info";
                    const { Icon, color, timer } = kinds[kind];
                    return (
                        <ToastPrimitive.Root
                            key={item.id}
                            type={kind === "danger" ? "foreground" : undefined}
                            duration={item.duration}
                            data-kind={kind}
                            onOpenChange={(open) => {
                                if (!open) remove(item.id);
                            }}
                            className="bs-toast relative flex items-start justify-between gap-between-groups overflow-hidden rounded-container border border-border-divider bg-surface-raised p-panel text-size-ui text-text-ui"
                        >
                            <Icon
                                aria-hidden="true"
                                className={cn("size-icon shrink-0", color)}
                            />
                            <div className="flex min-w-none flex-1 flex-col gap-in-group">
                                <p
                                    className={cn(
                                        "text-size-ui-small font-ui-strong uppercase",
                                        color,
                                    )}
                                >
                                    {kindLabels[kind]}
                                </p>
                                <ToastPrimitive.Title className="font-ui-strong">
                                    {item.title}
                                </ToastPrimitive.Title>
                                {item.description ? (
                                    <ToastPrimitive.Description className="text-size-ui-small text-text-muted">
                                        {item.description}
                                    </ToastPrimitive.Description>
                                ) : null}
                                {item.action ? (
                                    <ToastPrimitive.Action
                                        altText={item.action.label}
                                        asChild
                                    >
                                        <Button
                                            variant="secondary"
                                            onClick={item.action.onClick}
                                            className="self-start"
                                        >
                                            {item.action.label}
                                        </Button>
                                    </ToastPrimitive.Action>
                                ) : null}
                            </div>
                            <ToastPrimitive.Close asChild>
                                <IconButton
                                    aria-label={dismissLabel}
                                    tooltip={false}
                                >
                                    <X aria-hidden="true" />
                                </IconButton>
                            </ToastPrimitive.Close>
                            <span
                                aria-hidden="true"
                                data-testid="toast-timer"
                                className={cn(
                                    "bs-toast-timer absolute inset-x-none bottom-none h-tab-indicator",
                                    timer,
                                )}
                                style={{
                                    animationDuration: `${item.duration ?? DEFAULT_DURATION_MS}ms`,
                                }}
                            />
                        </ToastPrimitive.Root>
                    );
                })}
                <ToastPrimitive.Viewport
                    label={`${label} ({hotkey})`}
                    className="fixed inset-x-panel bottom-panel m-none flex list-none flex-col gap-in-group p-none tablet:left-auto tablet:w-overlay"
                />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
}

export { ToastProvider };
