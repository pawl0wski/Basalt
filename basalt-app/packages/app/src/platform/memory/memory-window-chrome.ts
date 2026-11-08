import type { WindowChrome } from "../platform";

function nothing(): void {}

export function createMemoryWindowChrome(): WindowChrome {
    return {
        minimize: nothing,
        toggleMaximize: nothing,
        close: nothing,
        subscribeMaximized() {
            return nothing;
        },
    };
}
