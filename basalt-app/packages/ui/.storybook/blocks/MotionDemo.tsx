import { useState } from "react";
import { readToken } from "./measure";

export function MotionDemo() {
    const [open, setOpen] = useState(false);
    const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return (
        <div className="flex flex-col gap-between-groups bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <div className="flex items-center gap-between-groups">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                    className="motion-feedback h-icon-button rounded-control border border-border-divider bg-button-secondary-bg px-between-groups hover:bg-state-selected focus-visible:focus-ring"
                >
                    {open ? "Close panel" : "Open panel"}
                </button>
                <span className="text-size-ui-small text-text-muted">
                    Operating system setting “reduce motion”:{" "}
                    {reduced ? "on, durations are 0" : "off"}
                </span>
            </div>
            <div
                className={`motion-panel rounded-container border border-border-divider bg-surface-raised p-panel ${open ? "opacity-100" : "opacity-0"}`}
                aria-hidden={!open}
            >
                This panel fades in with motion-panel:{" "}
                {readToken("motion-panel-duration")}, no spring.
            </div>
            <ul className="m-none flex max-w-prose flex-col gap-in-group pl-section">
                <li>
                    Hover and selection feedback:{" "}
                    <code className="font-code text-size-code">
                        motion-feedback
                    </code>
                    , {readToken("motion-feedback-duration")}, colour only
                    (R01.12, M1).
                </li>
                <li>
                    Opening panels, menus and dialogs:{" "}
                    <code className="font-code text-size-code">
                        motion-panel
                    </code>
                    , {readToken("motion-panel-duration")} or none (M2).
                </li>
                <li>
                    No spring, no scale, no motion for decoration (M2). Easing
                    is the single ease-out curve.
                </li>
                <li>
                    With{" "}
                    <code className="font-code text-size-code">
                        prefers-reduced-motion: reduce
                    </code>{" "}
                    both durations are 0 ms (M2, WCAG 2.3.3).
                </li>
            </ul>
        </div>
    );
}
