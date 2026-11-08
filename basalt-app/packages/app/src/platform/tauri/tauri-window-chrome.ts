import { getCurrentWindow } from "@tauri-apps/api/window";
import type { WindowChrome } from "../platform";

type TauriWindow = Pick<
    ReturnType<typeof getCurrentWindow>,
    "minimize" | "toggleMaximize" | "close" | "isMaximized" | "onResized"
>;

function ignoreFailure(): undefined {
    return undefined;
}

export function createTauriWindowChrome(
    getWindow: () => TauriWindow = getCurrentWindow,
): WindowChrome {
    return {
        minimize() {
            getWindow().minimize().catch(ignoreFailure);
        },
        toggleMaximize() {
            getWindow().toggleMaximize().catch(ignoreFailure);
        },
        close() {
            getWindow().close().catch(ignoreFailure);
        },
        subscribeMaximized(listener) {
            const target = getWindow();
            let active = true;
            let last: boolean | undefined;
            const refresh = () => {
                target
                    .isMaximized()
                    .then((maximized) => {
                        if (!active || maximized === last) return;
                        last = maximized;
                        listener(maximized);
                    })
                    .catch(ignoreFailure);
            };
            const unlisten = target.onResized(refresh);
            refresh();
            return () => {
                active = false;
                unlisten.then((stop) => stop()).catch(ignoreFailure);
            };
        },
    };
}
