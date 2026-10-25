import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { AdvertiseCtaLink, NewsletterSignupLink, SponsoredLink } from "@/components/analytics-events";
import { EIA_SERIES } from "@/lib/eia";
import {
  DAILY_NOTE_SPONSOR,
  formatLongDate,
  type DailyNote,
  type DailyNoteSeries,
  type PeriodChange,
  type PricePoint,
} from "@/lib/daily-note";
import { BEEHIIV_PUBLIC_URL } from "@/lib/newsletter";
import { formatLondonTimestamp, upcomingReleases, type ReleaseEvent } from "@/lib/release-calendar";
import { SITE } from "@/lib/site";

const SOURCE_URL = {
  RBRTE: EIA_SERIES.BRENT_SPOT.sourcePageUrl,
  RWTC: EIA_SERIES.WTI_SPOT.sourcePageUrl,
  RNGWHHD: EIA_SERIES.HENRY_HUB_SPOT.sourcePageUrl,
} as const;

function money(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function ChangeCell({ change }: { change: PeriodChange }) {
  if (change.absolute == null || change.percent == null) {
    return <span className="text-steel-500">n/a</span>;
  }
  const color = change.absolute > 0 ? "text-gain" : change.absolute < 0 ? "text-loss" : "text-steel-300";
  const pct = `${change.percent > 0 ? "+" : ""}${change.percent.toFixed(2)}%`;
  return (
    <span className={`num ${color}`}>
      {money(change.absolute)}
      <span className="mt-0.5 block text-[11px]">{pct}</span>
      {change.versusDate ? (
        <span className="mt-0.5 block text-[10px] font-sans text-steel-500">vs {formatLongDate(change.versusDate)}</span>
      ) : null}
    </span>
  );
}

function Sparkline({ name, points, stroke, fill }: { name: string; points: PricePoint[]; stroke: string; fill: string }) {
  if (points.length < 2) {
    return <p className="text-xs text-steel-500">Fewer than two {name} prints in this window.</p>;
  }
  const width = 280;
  const height = 72;
  const pad = 8;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = pad + (index * (width - pad * 2)) / (points.length - 1);
    const y = pad + (1 - (point.value - min) / span) * (height - pad * 2);
    return { x, y, date: point.date };
  });
  const d = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const label = `${name}, last ${points.length} EIA prints, ${first.date} ${first.value.toFixed(2)} to ${last.date} ${last.value.toFixed(2)}`;
  return (
    <figure>
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-steel-300">{name}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="mt-2 h-20 w-full">
        <path d={d} fill="none" className={stroke} strokeWidth="2" />
        {coords.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="2.5" className={fill} />
        ))}
      </svg>
      <table className="mt-2 w-full text-left font-mono text-[10px] text-steel-400">
        <caption className="sr-only">{name} last five EIA prints</caption>
        <thead>
          <tr>
            {points.map((point) => (
              <th key={point.date} scope="col" className="px-1 py-1 font-medium text-steel-500">
                {point.date.slice(5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {points.map((point) => (
              <td key={point.date} className="num px-1 py-1">
                {point.value.toFixed(2)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

function SeriesRow({ series }: { series: DailyNoteSeries }) {
  const { window } = series;
  return (
    <tr>
      <th scope="row" className="font-medium text-steel-200">
        <a href={SOURCE_URL[series.seriesId]} className="hover:text-gold-400">
          {series.name}
        </a>
        <span className="mt-0.5 block font-mono text-[10px] font-normal text-steel-500">{series.seriesId}</span>
      </th>
      <td className="whitespace-nowrap">{formatLongDate(window.latest.date)}</td>
      <td className="num whitespace-nowrap text-white">
        {window.latest.value.toFixed(2)}
        <span className="mt-0.5 block text-[10px] text-steel-500">{series.unit}</span>
      </td>
      <td>
        <ChangeCell change={window.day} />
      </td>
      <td>
        <ChangeCell change={window.week} />
      </td>
      <td>
        <ChangeCell change={window.month} />
      </td>
    </tr>
  );
}

function SponsorAndNewsletter() {
  return (
    <>
      <aside aria-label="Sponsored" className="rounded-lg border border-dashed border-gold-600/70 bg-ink-900 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Sponsored</p>
        {DAILY_NOTE_SPONSOR ? (
          <SponsoredLink href={DAILY_NOTE_SPONSOR.href} className="mt-2 inline-block text-sm font-semibold text-white underline">
            {DAILY_NOTE_SPONSOR.name}
          </SponsoredLink>
        ) : (
          <p className="mt-2 text-sm text-steel-300">
            <AdvertiseCtaLink href="/advertise" location="daily_sponsor_slot" className="font-semibold text-gold-400 underline">
              Sponsor this note
            </AdvertiseCtaLink>
          </p>
        )}
      </aside>
      <section className="rounded-lg border border-gold-600/40 bg-ink-900 p-6 sm:p-8" aria-labelledby="daily-newsletter">
        <p className="eyebrow">Newsletter</p>
        <h2 id="daily-newsletter" className="h2 mt-1">
          Get the morning note by email
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-400">
          The Daily Bottom Line is the desk&apos;s beehiiv publication. Sign-up is on that page. This site does not
          take an API key for it.
        </p>
        <NewsletterSignupLink href={BEEHIIV_PUBLIC_URL} location="daily_note" className="btn-primary mt-4">
          Sign up for the newsletter
        </NewsletterSignupLink>
      </section>
    </>
  );
}

export function DailyNoteUnavailable({ date }: { date?: string }) {
  const title = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `Daily note, ${formatLongDate(date)}` : "Daily note";
  const releases = upcomingReleases(new Date());
  return (
    <>
      <PageHeader
        eyebrow="Morning note"
        title={title}
        intro="EIA daily spot only. When the feed is not available, this page does not fill in a price."
      />
      <div className="container-site space-y-8 py-10">
        <section className="max-w-3xl space-y-4">
          <p className="text-sm leading-relaxed text-steel-300">
            EIA daily spot is not available for this note. No Brent, WTI or Henry Hub price is shown.
          </p>
          <p className="text-sm text-steel-400">
            Series used when the feed is up: Brent RBRTE, WTI RWTC, Henry Hub RNGWHHD. EIA publishes them with a lag of
            one to three days after the trade date.
          </p>
          <p className="text-sm font-medium text-steel-200">Information only, not investment advice.</p>
          <Link href="/data-sources" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
            Data sources
          </Link>
        </section>
        <section aria-labelledby="releases-h">
          <h2 id="releases-h" className="h2">
            Next releases
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {releases.map((release) => (
              <article key={release.id} className="card">
                <h3 className="text-sm font-semibold text-white">{release.title}</h3>
                <p className="mt-2 text-sm text-steel-200">{release.whenEt}</p>
                <p className="text-sm text-steel-400">{release.whenUk}</p>
                <p className="mt-2 text-xs leading-relaxed text-steel-500">{release.detail}</p>
                <a
                  href={release.href}
                  className="mt-3 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </article>
            ))}
          </div>
        </section>
        <SponsorAndNewsletter />
        <DisclaimerBlock />
      </div>
    </>
  );
}

export default function DailyNoteView({
  note,
  fetchedAt,
  fallback,
  archiveDates,
  releases,
  canonicalPath,
  releasesLabel,
}: {
  note: DailyNote;
  fetchedAt: string;
  fallback: boolean;
  archiveDates: string[];
  releases: ReleaseEvent[];
  canonicalPath: string;
  releasesLabel: string;
}) {
  const series = [note.brent, note.wti, ...(note.henryHub ? [note.henryHub] : [])];
  const url = `${SITE.url}${canonicalPath}`;
  const headline = `Daily morning note, ${formatLongDate(note.date)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": ["NewsArticle", "Article"],
    headline,
    datePublished: note.date,
    dateModified: fetchedAt,
    description: note.summary[0],
    articleBody: note.summary.join(" "),
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    mainEntityOfPage: url,
    url,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/icon-192.png` },
    },
    citation: [SOURCE_URL.RBRTE, SOURCE_URL.RWTC, SOURCE_URL.RNGWHHD],
    isBasedOn: "https://www.eia.gov/opendata/",
  };
  const older = archiveDates.filter((date) => date < note.date).slice(0, 12);
  const newer = archiveDates.filter((date) => date > note.date).slice(-1)[0] ?? null;
  const previous = older[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Morning note"
        title={headline}
        intro="Brent, WTI and Henry Hub from the EIA daily spot, with the change from the previous print, from about a week earlier and from about a month earlier. EIA lags the trade date by one to three days."
      />
      <div className="container-site space-y-8 py-10">
        <section className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-steel-300" aria-label="As of">
          <p>
            <span className="font-semibold text-white">As of the trade date.</span> Brent {formatLongDate(note.brent.window.latest.date)}
            . WTI {formatLongDate(note.wti.window.latest.date)}
            {note.henryHub ? `. Henry Hub ${formatLongDate(note.henryHub.window.latest.date)}` : ". Henry Hub not loaded"}
            . EIA publishes these daily spots with a lag of one to three days, so the trade date is not the day this page was opened.
          </p>
          <p className="mt-2 text-xs text-steel-500">
            Fetched {formatLondonTimestamp(fetchedAt)}. Source: U.S. Energy Information Administration, Open Data API.
            {fallback ? " This is the last successful read. A newer read did not succeed." : ""}
          </p>
        </section>

        <section aria-labelledby="prints-h">
          <h2 id="prints-h" className="h2">
            Prints
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            Day-on-day is the previous EIA print. Week-on-week is the newest print on or before seven calendar days
            earlier. Month-on-month is the newest print on or before thirty calendar days earlier. A missing comparison
            is left blank.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[720px]">
              <caption className="sr-only">EIA daily spot changes</caption>
              <thead>
                <tr>
                  <th scope="col">Series</th>
                  <th scope="col">Trade date</th>
                  <th scope="col">Latest</th>
                  <th scope="col">Day</th>
                  <th scope="col">Week</th>
                  <th scope="col">Month</th>
                </tr>
              </thead>
              <tbody>
                {series.map((item) => (
                  <SeriesRow key={item.seriesId} series={item} />
                ))}
              </tbody>
            </table>
          </div>
          {note.spread ? (
            <p className="mt-4 text-sm text-steel-300">
              Brent–WTI spread on {formatLongDate(note.spread.date)}:{" "}
              <span className="num font-semibold text-white">${note.spread.value.toFixed(2)}</span> per barrel (Brent{" "}
              {note.spread.brent.toFixed(2)} minus WTI {note.spread.wti.toFixed(2)}).
            </p>
          ) : (
            <p className="mt-4 text-sm text-steel-400">No shared Brent and WTI trade date in the prints loaded, so no spread is shown.</p>
          )}
        </section>

        <section aria-labelledby="chart-h">
          <h2 id="chart-h" className="h2">
            Last five EIA prints
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="card">
              <Sparkline name="Brent" points={note.brent.window.lastFive} stroke="stroke-gold-400" fill="fill-gold-400" />
            </div>
            <div className="card">
              <Sparkline name="WTI" points={note.wti.window.lastFive} stroke="stroke-steel-300" fill="fill-steel-300" />
            </div>
            <div className="card">
              {note.henryHub ? (
                <Sparkline
                  name="Henry Hub"
                  points={note.henryHub.window.lastFive}
                  stroke="stroke-gold-300"
                  fill="fill-gold-300"
                />
              ) : (
                <p className="text-sm text-steel-400">Henry Hub is not loaded, so no gas chart is shown.</p>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="summary-h" className="max-w-3xl">
          <h2 id="summary-h" className="h2">
            Summary
          </h2>
          <div className="prose-dark mt-4">
            {note.summary.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section aria-labelledby="releases-h">
          <h2 id="releases-h" className="h2">
            {releasesLabel}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            Clocks are America/New_York and Europe/London. The UK time moves with the civil calendar, including weeks
            when the US and the UK change clocks on different days.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {releases.map((release) => (
              <article key={release.id} className="card">
                <h3 className="text-sm font-semibold text-white">{release.title}</h3>
                <p className="mt-2 text-sm text-steel-200">{release.whenEt}</p>
                <p className="text-sm text-steel-400">{release.whenUk}</p>
                <p className="mt-2 text-xs leading-relaxed text-steel-500">{release.detail}</p>
                <a
                  href={release.href}
                  className="mt-3 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </article>
            ))}
          </div>
        </section>

        <SponsorAndNewsletter />

        <nav aria-label="Note archive" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {canonicalPath !== "/daily" ? (
            <Link href="/daily" className="font-semibold text-gold-400 hover:text-gold-300">
              Latest note
            </Link>
          ) : null}
          {newer ? (
            <Link href={`/daily/${newer}`} className="text-steel-300 hover:text-white">
              Newer, {formatLongDate(newer)}
            </Link>
          ) : null}
          {previous ? (
            <Link href={`/daily/${previous}`} className="text-steel-300 hover:text-white">
              Older, {formatLongDate(previous)}
            </Link>
          ) : null}
        </nav>
        {older.length > 0 ? (
          <section aria-labelledby="archive-h">
            <h2 id="archive-h" className="text-sm font-semibold uppercase tracking-widest text-steel-500">
              Earlier trade dates
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {older.map((date) => (
                <li key={date}>
                  <Link
                    href={`/daily/${date}`}
                    className="rounded border border-ink-700 px-2 py-1 font-mono text-xs text-steel-300 hover:border-gold-600/60 hover:text-white"
                  >
                    {date}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <DisclaimerBlock />
      </div>
      <JsonLd data={schema} />
    </>
  );
}
