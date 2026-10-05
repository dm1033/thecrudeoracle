"use client";

import { useMemo, useState } from "react";
import type { ArchiveEntry } from "@/lib/paper-fund";
import { usd } from "@/lib/paper-fund";

const FILTERS = [
  { id: "all", label: "All records" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
  { id: "win", label: "Winners" },
  { id: "loss", label: "Losers" },
  { id: "no-trade", label: "No-trade decisions" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function outcomeLabel(outcome: ArchiveEntry["outcome"]): string {
  if (outcome === "win") return "Winner";
  if (outcome === "loss") return "Loser";
  if (outcome === "open") return "Open";
  if (outcome === "no-trade") return "No trade";
  return "Flat";
}

function outcomeClass(outcome: ArchiveEntry["outcome"]): string {
  if (outcome === "win") return "bg-gain/15 text-gain";
  if (outcome === "loss") return "bg-loss/15 text-loss";
  if (outcome === "open") return "bg-gold-500/15 text-gold-400";
  return "bg-navy-800 text-steel-300";
}

export default function ArchiveBrowser({ entries }: { entries: ArchiveEntry[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === "open" && e.kind !== "open") return false;
      if (filter === "closed" && e.kind !== "closed") return false;
      if (filter === "win" && e.outcome !== "win") return false;
      if (filter === "loss" && e.outcome !== "loss") return false;
      if (filter === "no-trade" && e.outcome !== "no-trade") return false;
      if (q && !e.searchable.includes(q)) return false;
      return true;
    });
  }, [entries, filter, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block flex-1">
          <span className="sr-only">Search the trade archive</span>
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Search trade id, market, thesis…"
            className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-white placeholder:text-steel-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </label>
        <p className="text-xs text-steel-500">
          {shown.length} of {entries.length} record{entries.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter archive">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              filter === f.id ? "bg-gold-500 text-ink-950" : "bg-ink-800 text-steel-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {shown.length === 0 && (
          <p className="card text-sm text-steel-400">
            Nothing matches. Losing trades are not removed from this archive. If the list is empty, the fund has not closed a trade yet.
          </p>
        )}
        {shown.map((e) => (
          <article key={e.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gold-400">{e.id}</span>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${outcomeClass(e.outcome)}`}>
                {outcomeLabel(e.outcome)}
              </span>
              <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">{e.direction}</span>
              {e.pnl != null && (
                <span className={`ml-auto font-mono text-sm font-semibold ${e.pnl > 0 ? "text-gain" : e.pnl < 0 ? "text-loss" : "text-white"}`}>
                  {usd(e.pnl, true)}
                  {e.returnPct != null ? ` (${e.returnPct > 0 ? "+" : ""}${e.returnPct}%)` : ""}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold text-white">{e.title}</h3>
            <p className="mt-1 text-xs text-steel-500">
              Opened {e.opened}
              {e.closed ? ` · Closed ${e.closed}` : ""} · Entry {e.entry}
              {e.exit ? ` · Exit ${e.exit}` : ""} · Confidence {e.confidence}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{e.thesis}</p>
            {e.exitRationale && (
              <p className="mt-2 text-xs leading-relaxed text-steel-400">
                <span className="font-semibold text-gold-500">{e.kind === "closed" ? "Exit: " : "Why this could be wrong: "}</span>
                {e.exitRationale}
              </p>
            )}
            <p className="mt-2 text-[11px] text-steel-500">Holding: {e.holding}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
