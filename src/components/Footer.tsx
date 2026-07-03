import Link from "next/link";
import {
  SITE,
  NAV_MAIN,
  NAV_FOOTER_LEGAL,
  NAV_FOOTER_COMPANY,
  FINANCIAL_DISCLAIMER_SHORT,
  DATA_DISCLAIMER_SHORT,
} from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-700 bg-ink-900">
      <div className="container-site py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded bg-gold-500 font-mono text-sm font-bold text-ink-950">
                CO
              </span>
              <span className="text-base font-bold text-white">{SITE.name}</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-steel-500">{SITE.tagline}.</p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-steel-500">
              {FINANCIAL_DISCLAIMER_SHORT}
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-steel-500">
              {DATA_DISCLAIMER_SHORT}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">
              Intelligence
            </h2>
            <ul className="mt-3 space-y-2">
              {NAV_MAIN.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-steel-400 hover:text-gold-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">
              Company
            </h2>
            <ul className="mt-3 space-y-2">
              {NAV_FOOTER_COMPANY.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-steel-400 hover:text-gold-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-steel-500">
              Legal
            </h2>
            <ul className="mt-3 space-y-2">
              {NAV_FOOTER_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-steel-400 hover:text-gold-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-700 pt-6 text-xs text-steel-500">
          <p>
            © {new Date().getFullYear()} {SITE.name} · {SITE.domain} · Not financial advice.
            Capital at risk. Data may be delayed or indicative.
          </p>
        </div>
      </div>
    </footer>
  );
}
