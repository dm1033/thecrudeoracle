import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "UK Energy Security — Analysis for Investors",
  "UK energy security analysis: North Sea production decline, import dependency, LNG reliance, jobs and supply chains, fiscal and policy risk, and industrial competitiveness — with official source placeholders.",
  "/uk-energy-security"
);

const SOURCES = [
  { name: "UK DESNZ (Department for Energy Security and Net Zero)", url: "https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero" },
  { name: "North Sea Transition Authority", url: "https://www.nstauthority.co.uk/" },
  { name: "ONS (Office for National Statistics)", url: "https://www.ons.gov.uk/" },
  { name: "National Grid / NESO", url: "https://www.neso.energy/" },
  { name: "Climate Change Committee", url: "https://www.theccc.org.uk/" },
  { name: "Energy Institute Statistical Review", url: "https://www.energyinst.org/statistical-review" },
];

const FAQ_ITEMS = [
  {
    q: "Does the UK still produce oil and gas?",
    a: "Yes. The UK Continental Shelf still produces meaningful volumes of oil and gas, but output has been in structural decline since the early 2000s and the UK is now a significant net importer of both.",
  },
  {
    q: "Why does import dependency matter for investors?",
    a: "Import dependency links UK energy costs to global markets — particularly LNG. That affects inflation, industrial competitiveness, currency dynamics and the earnings of UK-exposed energy companies, all of which are investable themes.",
  },
  {
    q: "What is the biggest policy risk for North Sea investors?",
    a: "Fiscal instability. Changes to windfall taxation and licensing policy alter project economics after capital is committed, which raises the cost of capital for the whole basin. This is a core theme in our UKCS coverage.",
  },
];

export default function UkEnergySecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="UK Coverage · Evidence-Led"
        title="UK Energy Security"
        intro="How Britain sources its energy, what the decline of the North Sea means, and where the investment-relevant pressure points are — grounded in official data sources."
      />
      <div className="container-site space-y-10 py-10">
        <div className="prose-dark max-w-3xl">
          <h2>UK oil and gas production</h2>
          <p>
            The UK Continental Shelf (UKCS) remains a producing basin, but a mature one: production
            peaked around the turn of the century and has declined structurally since. Remaining
            output is concentrated in fewer, older hubs, with new supply dependent on near-field
            tie-backs and a small number of larger projects. Production, licensing and reserves
            data are published by the North Sea Transition Authority (source placeholder below).
          </p>

          <h2>Import dependency and domestic supply</h2>
          <p>
            As domestic production has fallen, the UK has become a structural net importer of both
            crude oil and natural gas. Gas arrives by pipeline from Norway and as LNG from the
            global market; crude and refined products arrive from a diversified but
            price-sensitive set of suppliers. Import dependency does not mean the lights go out —
            it means the UK pays the global marginal price, in full, at times of stress.
          </p>

          <h2>LNG imports: flexibility at a price</h2>
          <p>
            LNG terminals give Britain valuable supply flexibility, but LNG is a globally
            arbitraged commodity: every cargo the UK attracts is a cargo bid away from Asia or the
            Continent. In tight global markets this exposes UK households and industry directly to
            international competition for molecules.
          </p>

          <h2>Jobs, supply chains and skills</h2>
          <p>
            The offshore energy industry supports a large ecosystem of jobs and supply-chain
            capability, much of it concentrated in Scotland and the North East. That capability —
            engineering, subsea, drilling, project management — is also the workforce many
            transition sectors (offshore wind, carbon storage, hydrogen) expect to draw on. Basin
            activity levels and supply-chain health are therefore linked.
          </p>

          <h2>Tax and policy risk</h2>
          <p>
            Fiscal policy is the single largest swing factor for UKCS investment. Windfall levies,
            allowance design and licensing policy directly change project returns, and repeated
            changes raise the risk premium applied to the whole basin. We track the fiscal debate
            as an investment variable, not a political one.
          </p>

          <h2>Industrial competitiveness</h2>
          <p>
            Energy costs feed directly into the competitiveness of energy-intensive industry.
            Sustained gaps between UK industrial energy prices and those of competitor economies
            influence investment location decisions — an under-priced second-order effect of
            energy security policy.
          </p>

          <h2>The investor lens</h2>
          <p>
            For investors, UK energy security is a bundle of tradable themes: UKCS producers priced
            for fiscal risk, LNG infrastructure and shipping, grid and storage investment, and the
            companies exposed to industrial energy costs. Premium members receive the UK / North
            Sea note in every daily briefing.
          </p>
        </div>

        <section aria-labelledby="sources-h" className="card">
          <h2 id="sources-h" className="h3">
            Primary sources used for this coverage
          </h2>
          <p className="mt-1 text-xs text-steel-500">
            Source placeholders — figures on this page are described qualitatively; verify current
            data with the primary publications below.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-400 underline decoration-gold-600/40 hover:text-gold-300">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA
          heading="UK energy security, covered daily"
          body="Every premium briefing includes a UK / North Sea note: production, policy, prices and the UKCS equities affected."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
