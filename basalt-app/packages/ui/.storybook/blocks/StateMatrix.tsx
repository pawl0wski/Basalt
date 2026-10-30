import type { ReactNode } from "react";

export type StateRow = {
    label: string;
    previewState?: "hover" | "focus";
};

type StateMatrixProps = {
    columns: string[];
    rows: StateRow[];
    cell: (column: string, row: StateRow) => ReactNode;
};

export function StateMatrix({ columns, rows, cell }: StateMatrixProps) {
    return (
        <div className="overflow-x-auto bg-surface-editor p-panel font-text text-size-ui text-text-ui">
            <table className="border-collapse text-left">
                <thead>
                    <tr>
                        <th
                            scope="col"
                            className="p-in-group pr-section font-ui-strong"
                        >
                            State
                        </th>
                        {columns.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className="p-in-group font-ui-strong"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.label}
                            className="border-t border-border-divider"
                        >
                            <th
                                scope="row"
                                className="p-in-group pr-section font-normal text-text-muted"
                            >
                                {row.label}
                            </th>
                            {columns.map((column) => (
                                <td key={column} className="p-between-groups">
                                    <div
                                        data-preview-state={row.previewState}
                                        className="inline-flex"
                                    >
                                        {cell(column, row)}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
