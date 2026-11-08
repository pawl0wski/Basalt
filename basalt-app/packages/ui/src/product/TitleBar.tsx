import {
    Check,
    ChevronDown,
    Minus,
    PanelLeft,
    PanelRight,
    Plus,
    Copy,
    Square,
    X,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { IconButton } from "../components/IconButton";
import { Menu } from "../components/Menu";
import { cn } from "../lib/utils";
import { NoteTab } from "./NoteTab";

type TitleBarTab = {
    id: string;
    name: string;
    unsaved?: boolean;
};

type WindowControlLabels = {
    minimize: string;
    maximize: string;
    restore: string;
    close: string;
};

const defaultWindowControlLabels: WindowControlLabels = {
    minimize: "Minimize window",
    maximize: "Maximize window",
    restore: "Restore window",
    close: "Close window",
};

type WindowControls = {
    maximized?: boolean;
    labels?: WindowControlLabels;
    onMinimize: () => void;
    onToggleMaximize: () => void;
    onClose: () => void;
};

type TitleBarProps = {
    title?: string;
    tabs?: TitleBarTab[];
    activeTabId?: string;
    onSelectTab?: (id: string) => void;
    onCloseTab?: (id: string) => void;
    onNewNote?: () => void;
    onToggleSidebar?: () => void;
    onToggleSidePanel?: () => void;
    sidebarOpen?: boolean;
    sidePanelOpen?: boolean;
    windowControls?: WindowControls;
    className?: string;
};

function TitleBar({
    title,
    tabs = [],
    activeTabId,
    onSelectTab,
    onCloseTab,
    onNewNote,
    onToggleSidebar,
    onToggleSidePanel,
    sidebarOpen,
    sidePanelOpen,
    windowControls,
    className,
}: TitleBarProps) {
    const listRef = useRef<HTMLUListElement>(null);
    const [overflowing, setOverflowing] = useState(false);

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) {
            setOverflowing(false);
            return;
        }
        const measure = () =>
            setOverflowing(list.scrollWidth > list.clientWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, [tabs]);

    const labels = windowControls?.labels ?? defaultWindowControlLabels;

    return (
        <header
            aria-label="Window title bar"
            data-tauri-drag-region
            className={cn(
                "bs-title-bar flex h-titlebar items-center gap-between-groups bg-surface-frame px-between-groups",
                className,
            )}
        >
            {onToggleSidebar ? (
                <IconButton
                    aria-label="Toggle sidebar"
                    aria-expanded={sidebarOpen}
                    active={sidebarOpen}
                    onClick={onToggleSidebar}
                >
                    <PanelLeft aria-hidden="true" />
                </IconButton>
            ) : null}
            <div
                data-tauri-drag-region
                className="flex min-w-none flex-1 items-center gap-in-group self-stretch"
            >
                {title ? (
                    <span
                        data-tauri-drag-region
                        className="min-w-none flex-1 truncate px-in-group text-size-ui text-text-ui"
                    >
                        {title}
                    </span>
                ) : null}
                {tabs.length > 0 ? (
                    <ul
                        ref={listRef}
                        aria-label="Open notes"
                        className="m-none flex min-w-none list-none items-center gap-in-group self-stretch overflow-hidden px-in-group py-none"
                    >
                        {tabs.map((tab) => (
                            <NoteTab
                                key={tab.id}
                                name={tab.name}
                                active={tab.id === activeTabId}
                                unsaved={tab.unsaved}
                                onSelect={() => onSelectTab?.(tab.id)}
                                onClose={() => onCloseTab?.(tab.id)}
                            />
                        ))}
                    </ul>
                ) : null}
                {overflowing ? (
                    <Menu
                        trigger={
                            <IconButton aria-label="Show all open notes">
                                <ChevronDown aria-hidden="true" />
                            </IconButton>
                        }
                        items={tabs.map((tab) => ({
                            label: tab.name,
                            icon:
                                tab.id === activeTabId ? (
                                    <Check aria-hidden="true" />
                                ) : undefined,
                            onSelect: () => onSelectTab?.(tab.id),
                        }))}
                    />
                ) : null}
                {onNewNote ? (
                    <IconButton aria-label="New note" onClick={onNewNote}>
                        <Plus aria-hidden="true" />
                    </IconButton>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-in-group">
                {onToggleSidePanel ? (
                    <IconButton
                        aria-label="Toggle right panel"
                        aria-expanded={sidePanelOpen}
                        active={sidePanelOpen}
                        onClick={onToggleSidePanel}
                    >
                        <PanelRight aria-hidden="true" />
                    </IconButton>
                ) : null}
                {windowControls ? (
                    <>
                        <IconButton
                            aria-label={labels.minimize}
                            tooltip={false}
                            onClick={windowControls.onMinimize}
                        >
                            <Minus aria-hidden="true" />
                        </IconButton>
                        <IconButton
                            aria-label={
                                windowControls.maximized
                                    ? labels.restore
                                    : labels.maximize
                            }
                            tooltip={false}
                            onClick={windowControls.onToggleMaximize}
                        >
                            {windowControls.maximized ? (
                                <Copy aria-hidden="true" />
                            ) : (
                                <Square aria-hidden="true" />
                            )}
                        </IconButton>
                        <IconButton
                            aria-label={labels.close}
                            tooltip={false}
                            onClick={windowControls.onClose}
                        >
                            <X aria-hidden="true" />
                        </IconButton>
                    </>
                ) : null}
            </div>
        </header>
    );
}

export { TitleBar };
export type { TitleBarProps, TitleBarTab, WindowControlLabels, WindowControls };
