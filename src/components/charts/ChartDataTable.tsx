/**
 * Screen-reader-only tabular equivalent of a chart's data (WCAG 1.1.1
 * Non-text Content). The Recharts SVG next to it is marked aria-hidden in
 * ChartFrame — it carries no accessible name or per-point text, so without
 * this table the chart's data is invisible to assistive technology. Visually
 * hidden via the `sr-only` utility; the data itself is unchanged.
 */
export interface ChartTableColumn {
  key: string;
  label: string;
}

export default function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: ChartTableColumn[];
  rows: Record<string, string | number>[];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key}>{row[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
