import Link from "next/link";
import DataMeta from "@/components/DataMeta";
import type { DataCard } from "@/lib/dashboard-cards";

/** A figure from a public feed, with what it is, its source and its date. No rating. */
export default function DataCardView({ card }: { card: DataCard }) {
  return (
    <div className="card card-hover flex flex-col">
      <h3 className="text-sm font-semibold text-white">{card.label}</h3>
      <p className="num mt-2 text-base font-semibold text-gold-300">{card.value}</p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-steel-400">{card.detail}</p>
      <Link href={card.href} className="mt-2 text-xs font-semibold text-gold-400 hover:text-gold-300">
        More on this →
      </Link>
      <DataMeta
        source={card.sourceName}
        sourceUrl={card.sourceUrl ?? undefined}
        lastUpdated={card.asOf}
        dataType={card.dataType}
        staleAfterHours={card.staleAfterHours}
      />
    </div>
  );
}

export function DataCardGrid({ cards, empty }: { cards: DataCard[]; empty: string }) {
  if (!cards.length) {
    return <p className="mt-4 max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-steel-400">{empty}</p>;
  }
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <DataCardView key={card.id} card={card} />
      ))}
    </div>
  );
}
