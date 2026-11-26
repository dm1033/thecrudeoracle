import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import { SITE } from "@/lib/site";

const SOURCE_NOTES = [
  {
    source: "EIA",
    covers:
      "Brent (RBRTE) and WTI (RWTC) daily spots in dollars per barrel, Henry Hub (RNGWHHD) in dollars per MMBtu, and weekly stocks: US commercial crude ex-SPR (WCESTUS1), gasoline (WGTSTUS1), distillate (WDISTUS1) and Cushing (W_EPC0_SAX_YCUOK_MBBL). US government public-domain data.",
    update:
      "Daily spot values are posted once a week with the Weekly Petroleum Status Report, on Wednesday, or on Thursday when a US federal holiday moves that report. Weekly stocks are released Wednesday at 10:30 a.m. US Eastern, for the week ending the previous Friday. A successful read is cached for two hours.",
    delay: "The date shown is the trade date or the week-ending date, which is often several days behind the release.",
  },
  {
    source: "CFTC",
    covers:
      "NYMEX WTI managed-money futures positions (contract 067651) from the Disaggregated Commitments of Traders report. Net is long minus short, in contracts.",
    update:
      "The desk reads the report on the weekly cycle. CFTC usually releases it on Friday at 3:30 p.m. US Eastern, and later when its own schedule records a holiday delay.",
    delay: "Positions are as of the previous Tuesday. The print is delayed.",
  },
  {
    source: "FRED",
    covers:
      "Federal Reserve broad dollar index (DTWEXBGS) and the 10-year inflation-indexed Treasury yield (DFII10), via FRED. DTWEXBGS is not the ICE US Dollar Index.",
    update: "The public-data job reads FRED up to four times a day. The card keeps the series date FRED publishes.",
    delay: "The series date is the Federal Reserve's date. The figure is delayed.",
  },
  {
    source: "GDELT",
    covers:
      "Share of online news the GDELT Project monitors that matches a fixed keyword list, plus links to matching articles. It is a coverage count, not a risk rating.",
    update: "The same public-data job reads GDELT up to four times a day.",
    delay: "The latest point is usually one to two days old, and that date is shown. It is delayed.",
  },
  {
    source: "AIS",
    covers:
      "Delayed TankerMap positions for hulls at 1 knot or more that are not anchored, moored or drifting. Crude and LNG lanes, and the offshore rig marks, are fixed desk drawings. Satellite day and night layers are NASA mosaics.",
    update:
      "TankerMap refreshes through the day. The site re-reads the moving-tanker route every 30 minutes. A position older than six hours is badged on the vessel card.",
    delay:
      "The observation time is the AIS time, not the moment the page was opened. Not for navigation. The lanes and rigs are not a vessel feed and not a rig census.",
  },
] as const;

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
        intro="A professional oil and gas intelligence platform built on one belief: serious investors deserve public oil and gas data that is sourced, dated and explained clearly, without the noise."
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
              <strong>Independent:</strong> we do not recommend companies. No watchlist names or company
              notes are published yet. A name, when one is published, is monitored and not a recommendation.
            </li>
            <li>
              <strong>Honest about data:</strong> Brent, WTI and Henry Hub are delayed EIA daily
              spot prints. The site does not display live or real-time prices. Other values are
              labelled delayed, manual or indicative.
            </li>
          </ul>

          <h2>Editor</h2>
          <p>David John Miller CEng</p>
          <p>
            The morning note, the Wednesday stocks page and the longer notes are published by {SITE.name}. Where a note
            has a byline, that byline is the publication.
          </p>

          <h2>Data sources and methodology</h2>
          <p>
            Every figure the desk reads from a public source is delayed. The date on the page is the source&apos;s own
            date. A missing read is left blank.
          </p>
          <div className="not-prose my-4 grid gap-3">
            {SOURCE_NOTES.map((note) => (
              <article key={note.source} className="card">
                <h3 className="text-base font-semibold text-white">{note.source}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-300">
                  <span className="font-semibold text-steel-200">Covers. </span>
                  {note.covers}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-steel-300">
                  <span className="font-semibold text-steel-200">Update. </span>
                  {note.update}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-steel-300">
                  <span className="font-semibold text-steel-200">Delay. </span>
                  {note.delay}
                </p>
              </article>
            ))}
          </div>
          <p>
            The same sources are listed on <Link href="/data-sources">data sources</Link>. The public-data monitor
            states the same limits for the figures it draws.
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
            EIA publishes a price for each trading day and posts the new days once a week. Brent and WTI go out with
            the Weekly Petroleum Status Report, on Wednesday, or on Thursday when a US federal holiday moves that
            report. Henry Hub is posted on that same weekly rhythm. The date on the page is the trade date of the
            print, which is often several days behind the release, not the day you opened it.
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

          <h2>Corrections log</h2>
          <p>
            A correction is a fix to something this site published that was wrong. It is not a change of view. The rule
            is the <Link href="/corrections">corrections policy</Link>. Report one to{" "}
            <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Correction")}`}>{SITE.contactEmail}</a>.
          </p>
          <div className="not-prose my-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark">
              <caption className="sr-only">Corrections log</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Page</th>
                  <th scope="col">What changed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>None recorded</td>
                  <td>—</td>
                  <td>No correction has been entered on this log. EIA&apos;s own revision of a print is not listed here. That revision shows on the next successful read, with EIA&apos;s date.</td>
                </tr>
              </tbody>
            </table>
          </div>

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
