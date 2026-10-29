export interface AudienceMetric {
  id: string;
  label: string;
  /**
   * Measured figure, as text, once it exists. Null and blank values are not rendered.
   * Do not put an estimate, a range, or a placeholder number here.
   */
  value: string | null;
  /** ISO date the figure was measured. Unused while value is empty. */
  asOf: string | null;
}

/**
 * Audience figures for the media kit. Leave value null until a measurement exists.
 * The page hides every empty row.
 */
export const AUDIENCE_METRICS: AudienceMetric[] = [
  { id: "readers", label: "Readers", value: null, asOf: null },
  { id: "subscribers", label: "Newsletter subscribers", value: null, asOf: null },
  { id: "open-rate", label: "Email open rate", value: null, asOf: null },
];

export function filledAudienceMetrics(metrics: readonly AudienceMetric[] = AUDIENCE_METRICS): AudienceMetric[] {
  return metrics.filter((metric) => typeof metric.value === "string" && metric.value.trim().length > 0);
}
