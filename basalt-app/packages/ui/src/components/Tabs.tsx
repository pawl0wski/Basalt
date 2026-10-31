import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

type TabItem = {
    value: string;
    label: string;
    content: ReactNode;
};

type TabsProps = {
    tabs: TabItem[];
    label: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
};

function Tabs({ tabs, label, value, defaultValue, onValueChange }: TabsProps) {
    return (
        <TabsPrimitive.Root
            value={value}
            defaultValue={defaultValue ?? tabs[0]?.value}
            onValueChange={onValueChange}
            className="bs-tabs flex w-full flex-col gap-between-groups"
        >
            <TabsPrimitive.List
                aria-label={label}
                className="flex overflow-x-auto border-b border-border-divider"
            >
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.value}
                        value={tab.value}
                        className="bs-tab group relative h-icon-button shrink-0 whitespace-nowrap px-between-groups text-size-ui text-text-muted motion-feedback hover:text-text-ui focus-visible:focus-ring data-[state=active]:text-text-note"
                    >
                        {tab.label}
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-none bottom-none hidden h-tab-indicator bg-action-primary group-data-[state=active]:block"
                        />
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>
            {tabs.map((tab) => (
                <TabsPrimitive.Content
                    key={tab.value}
                    value={tab.value}
                    className="text-size-ui text-text-ui focus-visible:focus-ring"
                >
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}

export { Tabs };
export type { TabItem, TabsProps };
