import { useEffect, useState } from "react";
import { resolveColor, toHex } from "./measure";
import { colorGroups } from "./tokenData";

export function ColorRoles() {
    const [hex, setHex] = useState<Record<string, string>>({});
    useEffect(() => {
        setHex(
            Object.fromEntries(
                colorGroups.flatMap((group) =>
                    group.tokens.map((token) => [
                        token.name,
                        toHex(resolveColor(token.name)),
                    ]),
                ),
            ),
        );
    }, []);

    return (
        <div className="flex flex-col gap-section bg-surface-editor p-panel font-text text-text-ui text-size-ui">
            {colorGroups.map((group) => (
                <section
                    key={group.title}
                    className="flex flex-col gap-between-groups"
                >
                    <h3 className="font-ui-strong text-size-ui text-text-ui">
                        {group.title}
                    </h3>
                    <ul className="m-none flex list-none flex-col p-none">
                        {group.tokens.map((token) => (
                            <li
                                key={token.name}
                                className="flex flex-col gap-between-groups border-t border-border-divider py-between-groups tablet:flex-row"
                            >
                                <span className="flex items-start gap-between-groups tablet:basis-1/3 tablet:shrink-0">
                                    <span
                                        aria-hidden="true"
                                        className={`${token.swatch} size-icon-button shrink-0 rounded-control border border-border-control`}
                                    />
                                    <span className="flex flex-col gap-in-group">
                                        <code className="font-code text-size-code text-text-note">
                                            {token.name}
                                        </code>
                                        <span className="font-code text-size-ui-small text-text-muted">
                                            {hex[token.name]} · {token.utility}
                                        </span>
                                    </span>
                                </span>
                                <span className="flex max-w-prose flex-col gap-in-group">
                                    <span>
                                        <span className="font-ui-strong">
                                            Use:{" "}
                                        </span>
                                        {token.use}
                                    </span>
                                    <span>
                                        <span className="font-ui-strong">
                                            Avoid:{" "}
                                        </span>
                                        {token.avoid}
                                    </span>
                                    <span className="text-size-ui-small text-text-muted">
                                        Source: {token.source}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
