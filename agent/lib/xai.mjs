import { get, usable } from "./env.mjs";
import { guardedFetch } from "./allowlist.mjs";
import { log } from "./log.mjs";

// Deterministic, offline draft generator. Used whenever XAI_API_KEY is not a
// usable value, so `--cycle` dry-runs work with zero secrets and zero network.
function offlineDraft(prompt, context) {
  const tz = get("CODA_TIMEZONE", "Europe/London");
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    dateStyle: "full",
  }).format(new Date());

  const priceLines = context.priceLines?.length
    ? context.priceLines.join("\n")
    : "- No source-labelled prices available in the site data layer.";

  return [
    `# The Crude Oracle — Desk Note (offline dry-run)`,
    ``,
    `_${date} · ${tz} · generated without the xAI API (no key configured)_`,
    ``,
    `## 1. Headline`,
    `Draft generated locally for review. Not financial advice; watchlists are monitored names, not recommendations.`,
    ``,
    `## 2. Price picture`,
    priceLines,
    ``,
    `## 3. Supply`,
    `Supply/demand/risk signals should be reviewed against the site dashboard before publishing.`,
    ``,
    `## 4. Demand`,
    `Regional demand signals pending desk review.`,
    ``,
    `## 5. Bottom line`,
    context.bottomLine
      ? typeof context.bottomLine === "string"
        ? context.bottomLine
        : JSON.stringify(context.bottomLine)
      : "Thesis pending — this is a dry-run skeleton, not a published view.",
    ``,
    `---`,
    `Sources: EIA (public domain) and clearly-labelled indicative feeds only. No licensed PRA/exchange prints.`,
  ].join("\n");
}

export async function generateDraft(prompt, context) {
  if (!usable("XAI_API_KEY")) {
    log.warn("XAI_API_KEY not set — using deterministic offline draft generator.");
    return { text: offlineDraft(prompt, context), source: "offline-stub", model: null };
  }

  const base = get("XAI_API_BASE", "https://api.x.ai/v1").replace(/\/$/, "");
  const model = get("XAI_MODEL", "grok-4");
  const url = `${base}/chat/completions`;
  const body = {
    model,
    messages: [
      { role: "system", content: "You are the desk analyst for The Crude Oracle." },
      { role: "user", content: `${prompt}\n\n---\nContext:\n${context.text}` },
    ],
    temperature: 0.3,
    stream: false,
  };

  log.info(`Calling xAI model=${model} at ${base}`);
  const res = await guardedFetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${get("XAI_API_KEY")}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`xAI request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("xAI returned no content");
  return { text, source: "xai", model };
}
