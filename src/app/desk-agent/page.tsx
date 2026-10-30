import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CrudeOracleBot from "@/components/CrudeOracleBot";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { pageMeta } from "@/lib/seo";
import { getPublishedPrices } from "@/lib/published-prices";
import {
  CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
  CRUDE_ORACLE_PROMPT_VERSION,
  generateDeskLeadResponse,
} from "@/lib/crude-oracle-agent";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "CrudeOracle Desk Lead — Onscreen Oil & Gas Investment Agent",
  "Interactive terminal-grade oil & gas market intelligence bot powered by the CrudeOracle Master System Prompt (v30 Oct 2026): cited EIA/OPEC/IEA/COT data, bull/bear scenarios, invalidation levels and strict non-advisory risk controls.",
  "/desk-agent"
);

export default async function DeskAgentPage() {
  const feed = await getPublishedPrices();
  const initial = generateDeskLeadResponse(
    "Give me today's crude & gas market snapshot and key drivers.",
    feed,
    []
  );

  return (
    <>
      <PageHeader
        eyebrow={`Onscreen Bot Deployment · Version ${CRUDE_ORACLE_PROMPT_VERSION}`}
        title="CrudeOracle — The Desk Lead"
        intro="Punchy, terminal-grade market intelligence grounded in our EIA Open Data feed, global S&D Balance Engine, CFTC/ICE COT positioning, and News-to-Barrels event tracker. Every figure carries its source, timestamp, and delay label. Informational analysis only — never investment advice."
      />

      <div className="container-site space-y-10 py-10">
        <CrudeOracleBot
          mode="embedded"
          initialReply={initial.reply}
          initialEiaLive={feed.eia}
        />

        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Master System Prompt Specification</p>
              <h2 className="h2 mt-1">
                CrudeOracle Investment Agent — Master System Prompt (v{CRUDE_ORACLE_PROMPT_VERSION})
              </h2>
            </div>
            <span className="rounded border border-gold-500/40 bg-gold-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-gold-400">
              Ready for Onscreen Bot / Grok / Custom GPT / Claude
            </span>
          </div>
          <p className="text-sm text-steel-400">
            This master prompt governs both the onscreen CrudeOracle Desk Bot above and the CODA
            scheduled desk-note generator (`prompts/crude-oracle-master-system-prompt.md`).
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-steel-300">
            {CRUDE_ORACLE_MASTER_SYSTEM_PROMPT}
          </pre>
        </section>

        <DisclaimerBlock />
      </div>
    </>
  );
}
