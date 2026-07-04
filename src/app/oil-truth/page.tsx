import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "Oil Truth: What Crude Oil Is and Why It Still Matters",
  "A clear, evidence-led explanation of what crude oil is, what oil and gas are actually used for — plastics, medicine, fertilisers, transport, aviation, construction — and why they remain central to global energy systems.",
  "/oil-truth"
);

const FAQ_ITEMS = [
  {
    q: "Is oil only used for petrol and diesel?",
    a: "No. Road fuels are the largest single use, but a barrel of crude also yields jet fuel, marine fuel, petrochemical feedstocks (plastics, synthetic fibres, pharmaceuticals precursors), lubricants, bitumen for roads, and more. Natural gas additionally underpins fertiliser production via ammonia.",
  },
  {
    q: "If a country produces less oil, does the world use less oil?",
    a: "Not necessarily. Demand is set by consumers, not by any single producer. If one region cuts production while demand is unchanged, supply generally shifts to other producers — often with longer shipping distances and different regulatory standards.",
  },
  {
    q: "Why do oil prices show up in inflation?",
    a: "Energy is an input to almost everything: transport, food production (diesel and fertiliser), manufacturing and heating. When crude and gas prices rise, those costs propagate through supply chains into consumer prices — which is why central banks watch energy closely.",
  },
];

export default function OilTruthPage() {
  return (
    <>
      <PageHeader
        eyebrow="Free Education · Evidence-Led"
        title="Oil Truth: What Crude Oil Is and Why It Still Matters"
        intro="A plain-English, evidence-led primer for people who want to understand the commodity before they follow the market. No politics — just how the system actually works."
      />
      <div className="container-site space-y-10 py-10">
        <div className="prose-dark max-w-3xl">
          <h2>What crude oil is</h2>
          <p>
            Crude oil is a naturally occurring mixture of hydrocarbons formed from ancient organic
            matter under heat and pressure over geological time. Different fields produce different
            grades — lighter or heavier, sweeter (less sulphur) or more sour — and refineries are
            tuned to particular diets of these grades. &ldquo;Oil&rdquo; is not one product but a
            family of raw materials.
          </p>

          <h2>What oil and gas are actually used for</h2>
          <p>
            A barrel of crude is separated in a refinery into fractions, each with its own market:
          </p>
          <ul>
            <li><strong>Transport:</strong> petrol, diesel, jet fuel and marine fuel — moving people, food and freight.</li>
            <li><strong>Petrochemicals:</strong> the feedstock for plastics, packaging, synthetic fibres, paints and adhesives.</li>
            <li><strong>Medicine:</strong> pharmaceutical precursors, sterile plastics, syringes, tubing and equipment.</li>
            <li><strong>Fertilisers:</strong> natural gas is the key input to ammonia production, which underpins roughly half of global food production.</li>
            <li><strong>Construction:</strong> bitumen for roads and roofing; energy for cement and steel.</li>
            <li><strong>Aviation and shipping:</strong> sectors with few near-term energy-dense substitutes.</li>
          </ul>
          <p>
            This is why oil is not just petrol: even in a world of rapidly electrifying road
            transport, the non-fuel and hard-to-substitute uses of hydrocarbons persist.
          </p>

          <h2>How oil prices affect inflation</h2>
          <p>
            Energy is embedded in the cost of nearly everything. Diesel moves food from field to
            shelf; gas makes the fertiliser that grew it; petrochemicals wrap it. When crude rises,
            these costs flow through supply chains with a lag, showing up first in fuel and energy
            bills and later in core goods. This transmission is why energy shocks are
            macroeconomic events, not just sector news.
          </p>

          <h2>Why energy density matters</h2>
          <p>
            Hydrocarbons pack a large amount of energy into a small mass and volume, are storable
            for years, and are transportable in ordinary steel. That combination — density,
            storability, transportability — is what alternatives must match or work around, and it
            explains why aviation, shipping and heavy industry are the slowest sectors to
            substitute.
          </p>

          <h2>Why domestic production matters</h2>
          <p>
            A barrel not produced at home is a barrel imported — with the jobs, tax revenue and
            supply-chain capability located elsewhere, and with supply security dependent on
            shipping lanes and other governments&apos; choices. Domestic production is not a
            substitute for reducing demand; it determines who supplies whatever demand exists.
          </p>

          <h2>Reducing production is not the same as reducing demand</h2>
          <p>
            Demand is set by what consumers and industry actually use. If production falls in one
            country while demand is unchanged, imports rise to fill the gap. The emissions,
            economic activity and geopolitical leverage associated with that supply shift
            location — they do not disappear. Serious energy policy, and serious energy
            investing, treats demand and supply as separate questions.
          </p>

          <h2>Why oil and gas remain central to global energy systems</h2>
          <p>
            Hydrocarbons still supply the majority of the world&apos;s primary energy (see the
            Energy Institute Statistical Review for current figures). Transitions are underway and
            investable — but they are additive and gradual at global scale, constrained by
            capital cycles, materials and infrastructure. For investors, the truth is neither
            &ldquo;oil is over&rdquo; nor &ldquo;nothing changes&rdquo;: it is a long, uneven
            rebalancing in which both hydrocarbon and transition assets will make and lose
            fortunes. Understanding the physical system is the edge.
          </p>

          <h2>Sources for the numbers</h2>
          <ul>
            <li>
              <a href="https://www.energyinst.org/statistical-review" target="_blank" rel="noopener noreferrer">
                Energy Institute Statistical Review of World Energy
              </a>
            </li>
            <li>
              <a href="https://www.iea.org/data-and-statistics" target="_blank" rel="noopener noreferrer">
                IEA data and statistics (public pages)
              </a>
            </li>
            <li>
              <a href="https://www.eia.gov/" target="_blank" rel="noopener noreferrer">
                US EIA — Energy Information Administration
              </a>
            </li>
          </ul>
        </div>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA
          heading="Ready to go beyond the basics?"
          body="Premium members get the daily briefing, dashboards, watchlists and the research library — the professional layer on top of this foundation."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
