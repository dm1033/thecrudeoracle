export interface SpreadRow {
  instrument: string;
  value: string;
  unit: string;
  change: string;
  valuation: string;
  momentum: string;
  physical_check: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

const VALUATION_STYLE: Record<string, string> = {
  cheap: "bg-gain/15 text-gain",
  fair: "bg-steel-500/15 text-steel-400",
  expensive: "bg-loss/15 text-loss",
};

const MOMENTUM_STYLE: Record<string, string> = {
  tightening: "bg-gain/15 text-gain",
  loosening: "bg-loss/15 text-loss",
  stable: "bg-steel-500/15 text-steel-400",
};

const PHYSICAL_STYLE: Record<string, { cls: string; glyph: string }> = {
  supported: { cls: "bg-gain/15 text-gain", glyph: "✓" },
  contradicted: { cls: "bg-risk/15 text-risk", glyph: "✗" },
  mixed: { cls: "bg-steel-500/15 text-steel-400", glyph: "◆" },
};

function Badge({ text, cls, glyph }: { text: string; cls: string; glyph?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {glyph && <span aria-hidden className="mr-0.5">{glyph}</span>}
      {text}
    </span>
  );
}

export default function SpreadTable({
  title,
  accent,
  rows,
}: {
  title: string;
  accent: string;
  rows: SpreadRow[];
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-3 w-1 rounded-full ${accent}`} />
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-ink-700">
        <table className="table-dark min-w-[980px]">
          <thead className="bg-ink-900">
            <tr>
              <th>Instrument</th>
              <th className="text-right">Latest</th>
              <th className="text-right">Δ Change</th>
              <th className="text-center">Valuation</th>
              <th className="text-center">Momentum</th>
              <th className="text-center">Physical check</th>
              <th>Desk note</th>
              <th className="whitespace-nowrap">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const physical = PHYSICAL_STYLE[row.physical_check] ?? PHYSICAL_STYLE.mixed;
              return (
                <tr key={row.instrument} className="transition-colors hover:bg-ink-800/60">
                  <td className="font-medium text-steel-300">{row.instrument}</td>
                  <td className="num whitespace-nowrap text-right font-semibold text-white">
                    {row.value}
                    <span className="ml-1 text-[10px] font-normal text-steel-500">{row.unit}</span>
                  </td>
                  <td className="num whitespace-nowrap text-right">{row.change}</td>
                  <td className="text-center">
                    <Badge text={row.valuation} cls={VALUATION_STYLE[row.valuation] ?? VALUATION_STYLE.fair} />
                  </td>
                  <td className="text-center">
                    <Badge text={row.momentum} cls={MOMENTUM_STYLE[row.momentum] ?? MOMENTUM_STYLE.stable} />
                  </td>
                  <td className="text-center">
                    <Badge text={row.physical_check} cls={physical.cls} glyph={physical.glyph} />
                  </td>
                  <td className="max-w-[320px] text-xs">
                    {row.note}{" "}
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-steel-500 underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
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
