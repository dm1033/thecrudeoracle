import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PresentedBy from "@/components/PresentedBy";
import { calendarReleases } from "@/lib/release-calendar";
import { pageMeta } from "@/lib/seo";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Oil market release calendar",
  "Upcoming EIA Weekly Petroleum Status Report, CFTC Commitments of Traders and Baker Hughes rig-count release times. The EIA Short-Term Energy Outlook is monthly. Delayed public schedules. Not financial advice.",
  "/calendar",
);

export default function CalendarPage() {
  const releases = calendarReleases(new Date());
  return (
    <>
      <PageHeader
        eyebrow="Schedules"
        title="Release calendar"
        intro="When the public oil releases this site follows are due. Times are the publisher's clock, shown in US Eastern and UK time. Nothing here is a price."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="upcoming-h">
          <h2 id="upcoming-h" className="h2">
            Next five weeks
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            The Weekly Petroleum Status Report is Wednesday 10:30 a.m. US Eastern, or Thursday when a US federal holiday
            falls on the Monday or the Wednesday of that week. The CFTC Commitments of Traders report is usually Friday
            3:30 p.m. US Eastern. CFTC&apos;s published 2026 schedule moves some reports to the following Monday. The
            Baker Hughes rig count is usually Friday 1:00 p.m. US Eastern (noon Central), and on the earlier day Baker
            Hughes has posted for a holiday week. Where Baker Hughes has not posted that day, the row says it may
            shift. Rig counts are a link only. This site does not republish them.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[720px]">
              <caption className="sr-only">Upcoming EIA, CFTC and Baker Hughes releases</caption>
              <thead>
                <tr>
                  <th scope="col">Release</th>
                  <th scope="col">US Eastern</th>
                  <th scope="col">UK</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={`${release.id}-${release.at}`}>
                    <th scope="row" className="font-medium text-steel-200">
                      <a href={release.href} className="hover:text-gold-400" target="_blank" rel="noopener noreferrer">
                        {release.title}
                      </a>
                      <span className="mt-1 block text-xs font-normal text-steel-500">{release.detail}</span>
                    </th>
                    <td className="whitespace-nowrap">{release.whenEt}</td>
                    <td className="whitespace-nowrap">{release.whenUk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="steo-h" className="card max-w-3xl">
          <h2 id="steo-h" className="text-base font-semibold text-white">
            EIA Short-Term Energy Outlook
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">
            STEO is published once a month. This page does not assign it a clock time, because EIA sets that date on
            its own calendar and a guessed Tuesday would be a figure this site does not have. The world balance on{" "}
            <Link href="/tools/balance-engine" className="text-gold-400 underline hover:text-gold-300">
              the balance page
            </Link>{" "}
            moves when that outlook is read.
          </p>
          <p className="mt-3 text-sm">
            <a
              href="https://www.eia.gov/outlooks/steo/"
              className="font-semibold text-gold-400 hover:text-gold-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              EIA Short-Term Energy Outlook
            </a>
          </p>
        </section>

        <p className="max-w-3xl text-sm text-steel-400">
          Weekly stocks, once published, are on the{" "}
          <Link href="/eia-weekly" className="font-semibold text-gold-400 hover:text-gold-300">
            EIA weekly page
          </Link>
          . Positioning is on the{" "}
          <Link href="/tools/positioning" className="font-semibold text-gold-400 hover:text-gold-300">
            positioning page
          </Link>
          .
        </p>

        <PresentedBy location="release_calendar_sponsor" enquireHref="/advertise#release-calendar" />
        <p className="text-sm font-medium text-steel-200">Not financial advice.</p>
        <DisclaimerBlock />
      </div>
    </>
  );
}
