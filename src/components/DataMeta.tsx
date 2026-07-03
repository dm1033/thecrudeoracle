import { formatUpdated } from "@/lib/data";

const BADGE_STYLES: Record<string, string> = {
  live: "bg-gain/15 text-gain",
  delayed: "bg-risk/15 text-risk",
  manual: "bg-steel-500/15 text-steel-400",
  "API placeholder": "bg-navy-700/60 text-steel-300",
  indicative: "bg-risk/15 text-risk",
};

export function DataTypeBadge({ dataType }: { dataType: string }) {
  const style = BADGE_STYLES[dataType] ?? BADGE_STYLES.manual;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {dataType}
    </span>
  );
}

export default function DataMeta({
  source,
  sourceUrl,
  lastUpdated,
  dataType,
}: {
  source: string;
  sourceUrl?: string;
  lastUpdated: string;
  dataType: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
      <span>
        Source:{" "}
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
            {source}
          </a>
        ) : (
          source
        )}
      </span>
      <span>Updated: {formatUpdated(lastUpdated)}</span>
      <DataTypeBadge dataType={dataType} />
    </div>
  );
}
