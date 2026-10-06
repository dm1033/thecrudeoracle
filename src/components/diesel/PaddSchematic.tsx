import type { PaddRow } from "@/lib/diesel-assemble";

const BOX: Record<string, { x: number; y: number; w: number; h: number; short: string }> = {
  WDISTP51: { x: 16, y: 36, w: 108, h: 220, short: "PADD 5" },
  WDISTP41: { x: 136, y: 64, w: 88, h: 150, short: "PADD 4" },
  WDISTP21: { x: 236, y: 28, w: 168, h: 128, short: "PADD 2" },
  WDISTP31: { x: 236, y: 168, w: 196, h: 100, short: "PADD 3" },
  WDISTP11: { x: 444, y: 40, w: 150, h: 196, short: "PADD 1" },
};

function tone(row: PaddRow): { fill: string; stroke: string; arrow: string; word: string } {
  if (row.stocksMb == null || row.yearAgoMb == null) {
    return { fill: "#161b22", stroke: "#5c6776", arrow: "·", word: "TBC" };
  }
  if (row.stocksMb < row.yearAgoMb) {
    return { fill: "#2a1614", stroke: "#e74c3c", arrow: "↓", word: "Draw" };
  }
  if (row.stocksMb > row.yearAgoMb) {
    return { fill: "#12261c", stroke: "#2ecc71", arrow: "↑", word: "Build" };
  }
  return { fill: "#161b22", stroke: "#8b98a9", arrow: "→", word: "Flat" };
}

export default function PaddSchematic({ rows }: { rows: PaddRow[] }) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return (
    <figure className="card">
      <figcaption className="mb-3 text-sm font-semibold text-white">PADD stocks against last year</figcaption>
      <svg viewBox="0 0 610 280" role="img" aria-labelledby="padd-map-title" className="h-auto w-full">
        <title id="padd-map-title">Five PADD regions, distillate stocks against the year-ago week</title>
        {Object.entries(BOX).map(([id, box]) => {
          const row = byId.get(id);
          const paint = row ? tone(row) : tone({ id, name: id, stress: false, asOf: null, stocksMb: null, wowMb: null, yearAgoMb: null, yearAgoPeriod: null, sourceUrl: null });
          const stocks = row?.stocksMb == null ? "TBC" : `${row.stocksMb.toFixed(1)} mb`;
          return (
            <g key={id}>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={10} fill={paint.fill} stroke={row?.stress ? "#c9a038" : paint.stroke} strokeWidth={row?.stress ? 2.5 : 1.4} />
              <text x={box.x + 12} y={box.y + 24} fill="#c3ccd8" fontSize="12" fontWeight="700">
                {box.short}
              </text>
              <text x={box.x + 12} y={box.y + 46} fill="#ffffff" fontSize="16" fontWeight="700">
                {stocks}
              </text>
              <text x={box.x + 12} y={box.y + 68} fill={paint.stroke} fontSize="13" fontWeight="700">
                {paint.arrow} {paint.word}
              </text>
              {row?.stress ? (
                <text x={box.x + 12} y={box.y + 90} fill="#c9a038" fontSize="11">
                  Stress book
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[11px] leading-relaxed text-steel-500">
        Schematic of the five PADDs. Stock against the week 364 days earlier. Arrow is the year-ago change. Free book is US distillate. HO front is dark on this desk. ICE gasoil stays dark. No ARA PRA. No Singapore print.
      </p>
    </figure>
  );
}
