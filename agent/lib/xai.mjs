import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { get, resolvePath, usable } from "./env.mjs";
import { guardedFetch } from "./allowlist.mjs";
import { log } from "./log.mjs";

const MANDATORY_DISCLAIMER =
  "Information only — not investment advice, a recommendation, or an offer to buy/sell. Past performance is not indicative of future results. Verify all data with primary sources. AI-generated analysis may contain errors. Markets are volatile; capital is at risk. Consult a regulated financial adviser. Data may be delayed or indicative.";

function loadMasterSystemPrompt() {
  const dir = resolvePath(get("PROMPT_DIR", "./prompts"));
  const file = path.join(dir, "crude-oracle-master-system-prompt.md");
  if (existsSync(file)) {
    return readFileSync(file, "utf8");
  }
  return "You are CrudeOracle, the Desk Lead — an elite oil & gas investment analyst and market strategist.";
}

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
    `## 1. Market Snapshot`,
    priceLines,
    ``,
    `## 2. What Moved / Drivers`,
    `Draft generated locally from the desk data layer. Review supply, demand, and geopolitical signals against the live dashboard before publishing.`,
    ``,
    `## 3. Desk View`,
    context.bottomLine
      ? typeof context.bottomLine === "string"
        ? context.bottomLine
        : JSON.stringify(context.bottomLine)
      : "Bull case requires continued inventory draws and firm prompt timespreads; bear case rests on non-OPEC supply growth or softer refinery runs. Confidence: Low (offline dry-run skeleton).",
    ``,
    `## 4. Watchpoints & Invalidation`,
    `- Next EIA Weekly Petroleum Status Report and daily spot update (RBRTE, RWTC, RNGWHHD).`,
    `- Prompt M1/M2 timespreads and physical differentials vs Atlantic Basin loadings.`,
    ``,
    `## 5. Sources & Freshness`,
    `EIA Open Data (public domain, lagged 1–3 business days) and labelled desk marks. No unlicensed real-time exchange tape.`,
    ``,
    `---`,
    `${MANDATORY_DISCLAIMER}`,
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
      { role: "system", content: loadMasterSystemPrompt() },
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
