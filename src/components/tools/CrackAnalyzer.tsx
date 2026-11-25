"use client";

import { useMemo, useState } from "react";

export interface CrackInputs {
  brent: number | null;
  wti: number | null;
  gasolineGal: number | null;
  dieselGal: number | null;
}

function field(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function CrackAnalyzer({ spots }: { spots: CrackInputs }) {
  const [brent, setBrent] = useState(spots.brent == null ? "" : String(spots.brent));
  const [wti, setWti] = useState(spots.wti == null ? "" : String(spots.wti));
  const [gasoline, setGasoline] = useState(spots.gasolineGal == null ? "" : String(spots.gasolineGal));
  const [diesel, setDiesel] = useState(spots.dieselGal == null ? "" : String(spots.dieselGal));
  const [gasYield, setGasYield] = useState(2);
  const [dieselYield, setDieselYield] = useState(1);
  const [freight, setFreight] = useState("0");

  const result = useMemo(() => {
    const crude = field(wti);
    const gas = field(gasoline);
    const dist = field(diesel);
    const offset = field(freight) ?? 0;
    const barrels = gasYield + dieselYield;
    if (crude == null || gas == null || dist == null || barrels <= 0) return null;
    const product = (gasYield * gas * 42 + dieselYield * dist * 42) / barrels;
    return { product, crack: product - crude - offset, brentWti: field(brent) != null && crude != null ? field(brent)! - crude : null };
  }, [brent, wti, gasoline, diesel, gasYield, dieselYield, freight]);

  return (
    <section className="border border-border-hairline bg-surface-1 p-4">
      <p className="eyebrow">Arb and crack calculator</p>
      <p className="mt-2 text-sm text-ink-secondary">
        Inputs start from the EIA prints on this page when they loaded. Gasoline and diesel are dollars per gallon; the crack converts them at 42 gallons per barrel against WTI. A blank field stays blank.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Brent $/bbl" value={brent} onChange={setBrent} />
        <Field label="WTI $/bbl" value={wti} onChange={setWti} />
        <Field label="NYH gasoline $/gal" value={gasoline} onChange={setGasoline} />
        <Field label="NYH ULSD $/gal" value={diesel} onChange={setDiesel} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-ink-secondary">
          Gasoline yield {gasYield}
          <input type="range" min={1} max={5} value={gasYield} onChange={(event) => setGasYield(Number(event.target.value))} className="mt-1 block w-full" />
        </label>
        <label className="text-xs text-ink-secondary">
          Distillate yield {dieselYield}
          <input type="range" min={1} max={5} value={dieselYield} onChange={(event) => setDieselYield(Number(event.target.value))} className="mt-1 block w-full" />
        </label>
        <Field label="Freight offset $/bbl" value={freight} onChange={setFreight} />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Product barrel" value={result ? result.product.toFixed(2) : "—"} />
        <Stat label="Net crack" value={result ? result.crack.toFixed(2) : "—"} />
        <Stat label="Brent minus WTI" value={result?.brentWti == null ? "—" : result.brentWti.toFixed(2)} />
      </dl>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.08em] text-ink-muted">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" className="mt-1 w-full border border-border-strong bg-canvas px-2 py-1.5 font-mono text-sm text-ink-primary outline-none" />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-hairline px-3 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">{label}</dt>
      <dd className="num mt-1 text-lg text-ink-primary">{value}</dd>
    </div>
  );
}
