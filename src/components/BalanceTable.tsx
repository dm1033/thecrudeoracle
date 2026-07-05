export interface BalanceRow {
  metric: string;
  value: string;
  unit: string;
  change: string;
  trend: string;
  impact: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

const TREND_GLYPH: Record<string, { glyph: string; cls: string }> = {
  up: { glyph: "▲", cls: "text-gain" },
  down: { glyph: "▼", cls: "text-loss" },
  flat: { glyph: "—", cls: "text-steel-500" },
  mixed: { glyph: "◆", cls: "text-risk" },
};

const IMPACT_STYLE: Record<string, string> = {
  bullish: "bg-gain/15 text-gain",
  bearish: "bg-loss/15 text-loss",
  neutral: "bg-steel-500/15 text-steel-400",
};

export default function BalanceTable({
  title,
  accent,
  rows,
}: {
  title: string;
  accent: string;
  rows: BalanceRow[];
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-3 w-1 rounded-full ${accent}`} />
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-ink-700">
        <table className="table-dark min-w-[900px]">
          <thead className="bg-ink-900">
            <tr>
              <th>Metric</th>
              <th className="text-right">Latest</th>
              <th className="text-right">Δ Change</th>
              <th className="text-center">Trend</th>
              <th className="text-center">Price impact</th>
              <th>Desk note</th>
              <th>Source</th>
              <th className="whitespace-nowrap">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const trend = TREND_GLYPH[row.trend] ?? TREND_GLYPH.flat;
              const impact = IMPACT_STYLE[row.impact] ?? IMPACT_STYLE.neutral;
              return (
                <tr key={row.metric} className="transition-colors hover:bg-ink-800/60">
                  <td className="font-medium text-steel-300">{row.metric}</td>
                  <td className="num whitespace-nowrap text-right font-semibold text-white">
                    {row.value}
                    <span className="ml-1 text-[10px] font-normal text-steel-500">{row.unit}</span>
                  </td>
                  <td className="num whitespace-nowrap text-right">{row.change}</td>
                  <td className={`text-center ${trend.cls}`} aria-label={`trend ${row.trend}`}>
                    {trend.glyph}
                  </td>
                  <td className="text-center">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${impact}`}>
                      {row.impact}
                    </span>
                  </td>
                  <td className="max-w-[260px] text-xs">{row.note}</td>
                  <td className="max-w-[160px] text-xs">
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
                    >
                      {row.source}
                    </a>
                    <span className="ml-1 rounded bg-steel-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-steel-400">
                      {row.data_type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs">{row.last_updated}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
