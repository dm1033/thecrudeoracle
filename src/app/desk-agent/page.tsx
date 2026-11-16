import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CrudeOracleBot from "@/components/CrudeOracleBot";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { pageMeta } from "@/lib/seo";
import { getDeskData } from "@/lib/desk-data";
import { getPublishedPrices } from "@/lib/published-prices";
import { CRUDE_ORACLE_PROMPT_VERSION, generateDeskLeadResponse } from "@/lib/crude-oracle-agent";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Desk Bot: oil & gas market intelligence",
  "Ask about oil and gas market data: EIA prices, stocks and world balance, CFTC positioning and supply-route news coverage. Every figure is sourced and dated. No trading signals. Not financial advice.",
  "/desk-agent"
);

export default async function DeskAgentPage() {
  const [feed, data] = await Promise.all([getPublishedPrices(), getDeskData()]);
  const initial = generateDeskLeadResponse(
    "Give me today's crude & gas market snapshot and key drivers.",
    feed,
    [],
    data
  );

  return (
    <>
      <PageHeader
        eyebrow={`Onscreen Bot Deployment · Version ${CRUDE_ORACLE_PROMPT_VERSION}`}
        title="CrudeOracle — The Desk Lead"
        intro="Oil and gas questions answered from delayed public data: EIA prices, stocks and world balance, CFTC positioning and a count of supply-route news coverage. Every figure carries its source and date. Not a live feed. Not investment advice."
      />

      <div className="container-site space-y-10 py-10">
        <CrudeOracleBot
          mode="embedded"
          initialReply={initial.reply}
          initialEiaLive={feed.eia}
        />

        <p className="max-w-3xl text-sm leading-relaxed text-steel-400">
          Answers use delayed public figures from EIA, the CFTC, FRED and the GDELT Project. The bot does not see
          live exchange prices. Its instructions stay on the server.
        </p>

        <DisclaimerBlock />
      </div>
    </>
  );
}
