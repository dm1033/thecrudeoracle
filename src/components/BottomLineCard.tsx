import { bottomLine } from "@/lib/data";
import DataMeta from "@/components/DataMeta";

const ROWS: { key: keyof typeof bottomLine; label: string }[] = [
  { key: "what_moved", label: "What moved today" },
  { key: "why_it_moved", label: "Why it moved" },
  { key: "what_matters_next", label: "What matters next" },
  { key: "biggest_risk", label: "Biggest risk" },
  { key: "biggest_opportunity", label: "Biggest opportunity" },
  { key: "watch_tomorrow", label: "Watch tomorrow" },
];

export default function BottomLineCard() {
  return (
    <div className="card border-gold-600/40">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500">
          Daily Bottom Line
        </h3>
      </div>
      <dl className="mt-4 space-y-3">
        {ROWS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-steel-500">{label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-steel-300">{String(bottomLine[key])}</dd>
          </div>
        ))}
      </dl>
      <DataMeta
        source={bottomLine.source}
        lastUpdated={bottomLine.last_updated}
        dataType={bottomLine.data_type}
      />
    </div>
  );
}
