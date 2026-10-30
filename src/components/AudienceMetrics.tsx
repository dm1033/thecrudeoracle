import { filledAudienceMetrics, type AudienceMetric } from "@/lib/audience";

/** Renders only metrics that have a measured value. An empty config draws nothing. */
export default function AudienceMetrics({ metrics }: { metrics?: readonly AudienceMetric[] }) {
  const rows = filledAudienceMetrics(metrics);
  if (rows.length === 0) return null;
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      {rows.map((metric) => (
        <div key={metric.id} className="rounded-lg border border-ink-700 bg-ink-900 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-steel-500">{metric.label}</dt>
          <dd className="num mt-1 text-lg font-semibold text-white">{metric.value}</dd>
          {metric.asOf ? <dd className="mt-1 text-xs text-steel-500">As of {metric.asOf.slice(0, 10)}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
