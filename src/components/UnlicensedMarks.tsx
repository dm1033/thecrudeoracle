import Link from "next/link";

const LINKS = [
  {
    href: "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
    label: "EIA petroleum spot prices (Brent and WTI)",
  },
  {
    href: "https://www.eia.gov/dnav/ng/hist/rngwhhdD.htm",
    label: "EIA Henry Hub natural gas spot",
  },
  {
    href: "https://www.ice.com/energy",
    label: "ICE — NBP and TTF are not republished here",
  },
  {
    href: "https://www.spglobal.com/commodityinsights/en",
    label: "S&P Global Commodity Insights — Dubai is not republished here",
  },
] as const;

/** Link-outs for the licensed marks that used to be hard-coded on the board. */
export default function UnlicensedMarks() {
  return (
    <aside className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-steel-400">
      <h2 className="text-sm font-semibold text-white">Dubai, NBP and TTF are not shown</h2>
      <p className="mt-2">
        Dubai is a Platts assessment. UK NBP and Dutch TTF are ICE prices. Those series are licensed,
        so this site does not keep a manual mark for them.
      </p>
      <ul className="mt-3 space-y-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline decoration-gold-600/40 underline-offset-2 hover:text-gold-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3">
        <Link href="/data-sources" className="text-gold-400 underline decoration-gold-600/40 underline-offset-2 hover:text-gold-300">
          Data sources and licences
        </Link>
      </p>
    </aside>
  );
}
