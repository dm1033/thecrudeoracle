import type { MarketPrice } from "@/lib/data";
import DataMeta from "@/components/DataMeta";

function Change({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? "text-gain" : value < 0 ? "text-loss" : "text-steel-500";
  const sign = value > 0 ? "+" : "";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-steel-500">{label}</div>
      <div className={`num text-sm font-semibold ${color}`}>
        {sign}
        {value.toFixed(2)}%
      </div>
    </div>
  );
}

export default function MarketCard({ price }: { price: MarketPrice }) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{price.asset}</h3>
          <div className="font-mono text-[11px] text-steel-500">{price.ticker}</div>
        </div>
        <div className="text-right">
          <div className="num text-xl font-bold text-white">{price.price.toLocaleString("en-GB")}</div>
          <div className="text-[11px] text-steel-500">{price.currency}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Change label="Daily" value={price.daily_change} />
        <Change label="Weekly" value={price.weekly_change} />
        <Change label="Monthly" value={price.monthly_change} />
      </div>
      <DataMeta
        source={price.source}
        sourceUrl={price.source_url}
        lastUpdated={price.last_updated}
        dataType={price.data_type}
      />
    </div>
  );
}
