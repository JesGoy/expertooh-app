import type { ReactNode } from 'react';

export interface ComparisonColumn<Row> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (row: Row) => ReactNode;
}

interface ComparisonTableProps<Row> {
  columns: ComparisonColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
}

/** Tabla comparativa genérica para reportes (server-safe) */
export default function ComparisonTable<Row>({ columns, rows, rowKey }: ComparisonTableProps<Row>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-neutral-500">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-3 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right tabular-nums' : 'text-left'}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
