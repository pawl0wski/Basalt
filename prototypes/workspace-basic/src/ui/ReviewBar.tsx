import { memo } from "react";
import { SCREENS } from "../model/screens";

function ReviewBarBase() {
    return (
        <div className="doc-toolbar">
            <span className="proto-badge">Prototype</span>
            <button
                id="theme-toggle"
                type="button"
                className="btn btn-outline"
                aria-disabled="true"
                title="The design system has only the dark theme"
            >
                Theme: dark only
            </button>
            <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                    const details = document.querySelector<HTMLDetailsElement>(
                        ".screen.is-current .screen-notes",
                    );
                    if (!details) return;
                    details.open = true;
                    details.scrollIntoView({ block: "start" });
                }}
            >
                Screen notes
            </button>
            <nav className="screen-nav" aria-label="Screen map">
                {SCREENS.map((screen) => (
                    <a key={screen.id} href={`#${screen.id}`}>
                        {screen.id} {screen.name}
                    </a>
                ))}
            </nav>
        </div>
    );
}

export const ReviewBar = memo(ReviewBarBase);
