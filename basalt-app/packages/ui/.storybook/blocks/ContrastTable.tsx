import { useEffect, useState } from "react";
import { contrastPairs, thresholds } from "../../src/tokens/contrastPairs";
import { contrastRatio, resolveColor } from "./measure";

const verdictLabel = { pass: "Pass", fail: "Below threshold", decorative: "Not applicable" } as const;

export function ContrastTable({ kind }: { kind: "text" | "ui" }) {
    const [ratios, setRatios] = useState<number[]>([]);
    const pairs = contrastPairs.filter((pair) => pair.kind === kind);
    useEffect(() => {
        setRatios(pairs.map((pair) => contrastRatio(resolveColor(pair.foreground), resolveColor(pair.background))));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kind]);

    return (
        <div className="bg-surface-editor p-panel font-text text-text-ui text-size-ui">
            <table className="w-full border-collapse text-left">
                <caption className="pb-between-groups text-left text-size-ui-small text-text-muted">
                    Measured in the browser from the live CSS variables. Threshold: {thresholds[kind]} : 1.
                </caption>
                <thead>
                    <tr className="border-b border-border-divider">
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Foreground</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Background</th>
                        <th scope="col" className="py-in-group pr-between-groups text-right font-ui-strong">Ratio</th>
                        <th scope="col" className="py-in-group pr-between-groups font-ui-strong">Result</th>
                        <th scope="col" className="py-in-group font-ui-strong">Note and source</th>
                    </tr>
                </thead>
                <tbody>
                    {pairs.map((pair, index) => (
                        <tr key={`${pair.foreground}-${pair.background}`} className="border-b border-border-divider align-top">
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{pair.foreground}</code></td>
                            <td className="py-in-group pr-between-groups"><code className="font-code text-size-code">{pair.background}</code></td>
                            <td className="py-in-group pr-between-groups text-right tabular-nums">
                                {ratios[index] === undefined ? "" : ratios[index].toFixed(2)}
                            </td>
                            <td className="py-in-group pr-between-groups">{verdictLabel[pair.verdict]}</td>
                            <td className="py-in-group text-text-muted">
                                {pair.note ? `${pair.note} ` : ""}({pair.source})
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
