import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  ...pageMeta(
    "Admin — Daily Update System",
    "Admin instructions for updating The Crude Oracle's daily data.",
    "/admin"
  ),
  robots: { index: false, follow: false },
};

const TASKS: { title: string; file: string; what: string }[] = [
  {
    title: "Update the daily briefing",
    file: "data/daily-briefing.json",
    what: "Add a new object to the TOP of the `briefings` array with today's date, all 11 sections, sources and `status: \"published\"`. Keep older entries below — they become the archive automatically.",
  },
  {
    title: "Update market prices",
    file: "data/market-prices.json",
    what: "Edit `price`, `daily_change`, `weekly_change`, `monthly_change`, `trend`, and set `last_updated` (ISO timestamp) for each asset. Set `data_type` honestly: manual / delayed / indicative / API placeholder.",
  },
  {
    title: "Update signals & bottom line",
    file: "data/dashboard-signals.json",
    what: "Refresh `supply`, `demand` and `risk` card values/details, and rewrite the six `bottom_line` fields. Update every `last_updated` you touch.",
  },
  {
    title: "Update the watchlist",
    file: "data/investment-watchlist.json",
    what: "Edit or add company objects. Required fields include thesis, catalyst, risk, source and last_updated. Every entry is displayed with a 'Watchlist, not recommendation' label — write accordingly.",
  },
  {
    title: "Add a company intelligence note",
    file: "data/company-intelligence.json",
    what: "Add or update a company object with production, reserves, financial health, valuation, management, catalyst, risk, `latest_update` and `sources`.",
  },
  {
    title: "Update the Balance Engine",
    file: "data/balance-engine.json",
    what: "Refresh `supply`, `demand` and `stocks` rows (value, change, trend, impact, note, last_updated) and recompute `balance_summary` (total_supply, total_demand, implied_balance = supply − demand). Impact flags read from the price's perspective: less supply / more demand = bullish.",
  },
  {
    title: "Update the Flow Map",
    file: "data/flow-map.json",
    what: "Refresh `loadings`, `discharges` and `signals` rows, rewrite `flow_summary`, and maintain `anomalies`: each needs severity (info/watch/alert), sigma vs 30-day baseline, observed vs baseline values, a plain-English explanation, contributing factors (direction up/down/flat) and a 'so what' implication. Remove anomalies that have normalised.",
  },
  {
    title: "Update the Curve & Spread Dashboard",
    file: "data/curve-monitor.json",
    what: "Refresh `flat_price`, `timespreads`, `differentials`, `cracks`, `arbitrage` rows and the `forward_curves` M1–M12 arrays. Each row needs the three verdicts: valuation (cheap/fair/expensive vs 5-yr seasonal range), momentum (tightening/loosening/stable over 20 sessions), physical_check (supported/contradicted/mixed vs Modules 1–2) plus a desk note explaining any contradiction. Rewrite `curve_summary`.",
  },
  {
    title: "Update charts",
    file: "data/chart-data.json",
    what: "Append the latest point to each series (Brent/WTI, gas, inventories, rig count, OPEC production, watchlist performance, sector heatmap) and update `meta.last_published`.",
  },
  {
    title: "Add a research note",
    file: "data/research-library.json",
    what: "Add an object to `notes` with id, title, category, access (free/premium), summary, date, reading_time, sources and status (published/draft). Draft entries are hidden.",
  },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin · Not Linked Publicly"
        title="Daily Update System"
        intro="The site is fully data-driven from JSON files in /data. Edit, commit, deploy — every dashboard, briefing and card updates automatically. Full detail in docs/DAILY_UPDATE_GUIDE.md."
      />
      <div className="container-site space-y-8 py-10">
        <div className="card border-risk/40 bg-risk/5 p-5 text-sm text-steel-300">
          <p>
            <strong className="text-risk">Publishing workflow:</strong> edit the JSON file → set{" "}
            <code className="font-mono text-gold-400">last_updated</code> /{" "}
            <code className="font-mono text-gold-400">status</code> → commit → push. Vercel/Netlify
            rebuilds and deploys automatically. Use <code className="font-mono">status: &quot;draft&quot;</code>{" "}
            on briefing/research entries to keep them unpublished.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {TASKS.map((t) => (
            <div key={t.file} className="card">
              <h2 className="h3">{t.title}</h2>
              <p className="mt-1 font-mono text-xs text-gold-400">{t.file}</p>
              <p className="mt-2 text-sm leading-relaxed text-steel-500">{t.what}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="h3">Daily checklist (5–15 minutes)</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-steel-400">
            <li>Update market prices and set fresh timestamps.</li>
            <li>Refresh supply / demand / risk signals that changed.</li>
            <li>Rewrite the Daily Bottom Line (six fields).</li>
            <li>Write today&apos;s briefing (11 sections) at the top of the briefings array.</li>
            <li>Append chart data points.</li>
            <li>Touch any watchlist / company notes affected by news, with sources.</li>
            <li>Commit with message <code className="font-mono">daily update YYYY-MM-DD</code> and push.</li>
            <li>Spot-check the live site after deploy.</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="h3">Roadmap: browser-based admin</h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-500">
            Phase 2 replaces JSON editing with a database (Supabase) and an authenticated admin UI
            with draft/publish controls — see docs/ROADMAP.md. The JSON schema above maps 1:1 to
            the planned tables, so content migrates cleanly.
          </p>
        </div>
      </div>
    </>
  );
}
