import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "About — The Crude Oracle",
  "The Crude Oracle is a professional oil and gas intelligence platform: daily crude, gas and energy-security intelligence for investors, traders and energy professionals — clear, concise and source-backed.",
  "/about"
);

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Who We Are"
        title="About The Crude Oracle"
        intro="A professional oil and gas intelligence platform built on one belief: serious investors deserve terminal-grade data, explained clearly, without the noise."
      />
      <div className="container-site space-y-10 py-10">
        <figure className="overflow-hidden rounded-lg border border-ink-700">
          <div className="relative aspect-[21/9]">
            <Image
              src="/images/brand-compass.jpg"
              alt="Navigator's compass and sextant in front of a market screen showing TheCrudeOracle.com"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-ink-700 bg-ink-900 p-3 text-xs text-steel-500">
            Old instruments, new market: navigation has always been about trusted readings, taken
            daily. That&apos;s the job.
          </figcaption>
        </figure>

        <div className="prose-dark max-w-3xl">
          <h2>What we do</h2>
          <p>
            The Crude Oracle publishes daily crude oil, gas, energy-security and investment
            intelligence for investors, traders and energy professionals. Every trading day we
            distil the oil and gas complex into a briefing you can read in minutes: what moved,
            why it moved, what matters next.
          </p>

          <h2>How we work</h2>
          <ul>
            <li>
              <strong>Source-backed:</strong> every data card cites its source, timestamp and
              licence status. We draw on public agencies (EIA, IEA, OPEC publications, UK DESNZ,
              the North Sea Transition Authority, ONS, the Energy Institute) and primary company
              disclosures.
            </li>
            <li>
              <strong>Clear over clever:</strong> we write for decision-makers. Short sections,
              plain English, no jargon walls, no filler.
            </li>
            <li>
              <strong>Independent:</strong> we monitor companies; we never recommend them. Every
              watchlist entry carries a &ldquo;watchlist, not recommendation&rdquo; label.
            </li>
            <li>
              <strong>Honest about data:</strong> we do not display unlicensed real-time exchange
              data. Values are labelled live, delayed, manual or indicative — always.
            </li>
          </ul>

          <h2>Author</h2>
          <p>
            The morning note, the Wednesday stocks page and the longer notes are published by {SITE.name}. This page
            does not name an individual author, and it does not list credentials, a track record or a professional
            qualification. Where a note has a byline, that byline is the publication.
          </p>

          <h2>Methodology</h2>
          <p>
            The daily note is arithmetic on three EIA Open Data series: Brent RBRTE and WTI RWTC, both in dollars per
            barrel from petroleum/pri/spt, and Henry Hub RNGWHHD in dollars per MMBtu from natural-gas/pri/fut. The
            page shows the latest print, the previous print, the newest print on or before seven calendar days
            earlier, and the newest print on or before thirty calendar days earlier. The Brent–WTI spread is Brent
            minus WTI on a shared trade date. No forecast is added, and a missing print is left blank.
          </p>
          <p>
            EIA publishes those daily spots one to two business days after the trade date. Weekends and US holidays
            can make the calendar gap longer. The date on the page is the trade date of the print, not the day you
            opened it.
          </p>
          <p>
            The Wednesday page reads the Weekly Petroleum Status Report from petroleum/stoc/wstk: US commercial crude
            excluding the Strategic Petroleum Reserve (WCESTUS1), total gasoline (WGTSTUS1), distillate (WDISTUS1) and
            Cushing crude (W_EPC0_SAX_YCUOK_MBBL). EIA reports those stocks in thousand barrels. The page divides by
            1,000 and labels the result in million barrels, and it shows the week-on-week change against the previous
            published week. The report itself is released on Wednesday at 10:30 a.m. US Eastern, for the week ending
            the previous Friday.
          </p>
          <p>
            Other pages still carry hand-maintained notes. Each card says whether its figure is delayed, manual or a
            placeholder, and links the source. A wrong figure is handled under the{" "}
            <Link href="/corrections">corrections policy</Link>. Sponsors do not see copy before publication. That
            rule is the <Link href="/editorial-policy">editorial policy</Link>.
          </p>

          <h2>What we are not</h2>
          <p>
            The Crude Oracle is not a regulated financial adviser. It is not authorised or regulated
            by the Financial Conduct Authority, and it does not provide financial advice, investment
            advice or recommendations to buy, sell or hold anything. We provide market commentary,
            research and education so you can make your own decisions — with a regulated adviser where
            appropriate. See our <Link href="/financial-disclaimer">Financial Disclaimer</Link>. Not
            financial advice.
          </p>

          <h2>Coverage</h2>
          <p>
            Crude benchmarks (Brent and WTI, from the EIA daily spot) · US gas (Henry Hub, from the
            EIA) · LNG and shipping · OPEC+ and supply risk · demand signals · energy equities
            across twelve segments · UK energy security and the North Sea. Dubai, UK NBP and Dutch
            TTF are not priced here.
          </p>
        </div>
        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
