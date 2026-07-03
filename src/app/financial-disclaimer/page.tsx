import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Financial Disclaimer",
  "The Crude Oracle financial disclaimer: market commentary and research for information purposes only — not financial advice or investment recommendations. Capital at risk.",
  "/financial-disclaimer"
);

export default function FinancialDisclaimerPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Financial Disclaimer" />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <p>
            <strong>
              The Crude Oracle provides market commentary, educational content and investment
              research for information purposes only. It is not financial advice, investment
              advice, tax advice or a recommendation to buy, sell or hold any security, commodity,
              derivative, fund or financial product. Users must conduct their own research and
              consult a regulated financial adviser where appropriate. Trading and investing
              involve risk, including loss of capital.
            </strong>
          </p>

          <h2>1. No advice, no recommendations</h2>
          <p>
            Nothing on this website, in any briefing, dashboard, watchlist, company intelligence
            note, research note, email or other communication from {SITE.name} constitutes
            financial advice, investment advice, tax advice, legal advice, or a recommendation,
            solicitation or offer to buy or sell any security, commodity, derivative, currency,
            fund or other financial product. Watchlists identify monitored names only; inclusion
            is never a recommendation.
          </p>

          <h2>2. Not a regulated adviser</h2>
          <p>
            {SITE.name} is a publisher of market commentary, research and education. It is not
            authorised or regulated by the Financial Conduct Authority or any other financial
            regulator, and does not provide personal recommendations or portfolio management.
          </p>

          <h2>3. No guarantee of accuracy</h2>
          <p>
            Content is prepared with care from sources believed reliable, but we make no
            representation or warranty, express or implied, as to its accuracy, completeness or
            timeliness. Data may be delayed, indicative, estimated or manually updated. Errors and
            omissions may occur.
          </p>

          <h2>4. No guarantee of returns</h2>
          <p>
            Nothing on this site guarantees, promises or implies any profit, return or trading
            outcome. We do not provide &ldquo;guaranteed signals&rdquo; of any kind. Past
            performance and historical commentary are not indicators of future results.
          </p>

          <h2>5. Your responsibility</h2>
          <p>
            All investment and trading decisions are yours alone. You are responsible for your own
            research, for verifying data against primary sources, and for taking advice from a
            regulated financial adviser where appropriate to your circumstances.
          </p>

          <h2>6. Risk warning</h2>
          <p>
            Trading and investing in oil, gas, energy markets, equities, funds and derivatives
            involve substantial risk, including sudden and severe price movements, illiquidity,
            leverage effects and the loss of some or all invested capital. Commodity and energy
            markets can be exceptionally volatile. Never invest money you cannot afford to lose.
          </p>

          <h2>7. Liability</h2>
          <p>
            To the maximum extent permitted by law, {SITE.name} accepts no liability for any loss
            or damage arising from reliance on any content published on this site or in member
            communications. See also the Terms of Use and Data Disclaimer.
          </p>

          <p className="text-sm text-steel-500">Last updated: 3 July 2026</p>
        </div>
      </div>
    </>
  );
}
