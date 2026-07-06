import portfolioData from "../../data/virtual-portfolio.json";

/** Mandatory disclaimer — rendered on every virtual-portfolio report and page. */
export default function PaperTradingDisclaimer() {
  return (
    <aside
      aria-label="Paper trading disclaimer"
      className="rounded-lg border border-risk/40 bg-risk/5 p-4 text-xs leading-relaxed text-steel-400"
    >
      <p className="font-bold uppercase tracking-wide text-risk">
        Paper trading only — virtual capital
      </p>
      <p className="mt-2">{portfolioData.meta.disclaimer}</p>
    </aside>
  );
}
