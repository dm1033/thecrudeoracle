import type { SignalCard } from "@/lib/data";
import DataMeta from "@/components/DataMeta";

const SIGNAL_STYLES: Record<string, { dot: string; label: string }> = {
  bullish: { dot: "bg-gain", label: "text-gain" },
  bearish: { dot: "bg-loss", label: "text-loss" },
  neutral: { dot: "bg-steel-500", label: "text-steel-400" },
  risk: { dot: "bg-risk", label: "text-risk" },
};

export default function SignalCardView({ card }: { card: SignalCard }) {
  const style = SIGNAL_STYLES[card.signal] ?? SIGNAL_STYLES.neutral;
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{card.label}</h3>
        <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${style.label}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {card.signal}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-gold-300">{card.value}</p>
      <p className="mt-2 text-xs leading-relaxed text-steel-500">{card.detail}</p>
      <DataMeta
        source={card.source}
        sourceUrl={card.source_url}
        lastUpdated={card.last_updated}
        dataType={card.data_type}
      />
    </div>
  );
}
