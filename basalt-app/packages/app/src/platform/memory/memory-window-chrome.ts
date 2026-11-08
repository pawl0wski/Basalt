import type { WindowChrome } from "../platform";

function nothing(): void {}

export function createMemoryWindowChrome(): WindowChrome {
    const handlers = new Set<() => Promise<boolean>>();
    return {
        minimize: nothing,
        toggleMaximize: nothing,
        close() {
            for (const handler of [...handlers]) void handler();
        },
        destroy: nothing,
        onCloseRequested(handler) {
            handlers.add(handler);
            return () => {
                handlers.delete(handler);
            };
        },
        subscribeMaximized() {
            return nothing;
        },
    };
}
