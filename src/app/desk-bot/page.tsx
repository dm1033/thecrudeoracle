import type { Metadata } from "next";
import DeskTerminal from "@/components/desk-bot/DeskTerminal";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Desk Bot: oil & gas market intelligence",
  "Ask about oil and gas market data: EIA prices, stocks and world balance, CFTC positioning and supply-route news coverage. Every figure is sourced and dated. No trading signals. Not financial advice.",
  "/desk-bot"
);

export default function DeskBotPage() {
  return (
    <>
      <div className="border-b border-border-hairline px-4 py-3">
        <p className="eyebrow">Commodities research terminal</p>
        <h1 className="font-serif text-2xl text-ink-primary">Desk Bot</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-secondary">
          Slash commands read the published desk and pin a table. A written question still uses the Desk Lead. Figures stay sourced and dated. This is not investment advice.
        </p>
      </div>
      <DeskTerminal />
      <div className="container-site py-8">
        <DisclaimerBlock />
      </div>
    </>
  );
}
