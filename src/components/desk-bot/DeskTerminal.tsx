"use client";

import { useEffect, useState } from "react";
import { artifactCsv, downloadText, downloadWatermarkedPng } from "@/lib/artifact-export";
import type { DeskBotArtifact, DeskBotCitation, DeskBotTraceStep } from "@/lib/desk-bot-artifacts";

interface Turn {
  query: string;
  reply: string;
  trace: DeskBotTraceStep[];
  citations: DeskBotCitation[];
  artifact: DeskBotArtifact | null;
  command: string | null;
}

const CHIPS = ["/eia-summary", "/spread brent-wti", "/cot-extremes", "/chokepoint hormuz", "/balance-global"];

export default function DeskTerminal({ initialCommand = "", compact = false }: { initialCommand?: string; compact?: boolean }) {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [openTrace, setOpenTrace] = useState<number | null>(0);
  const [citation, setCitation] = useState<DeskBotCitation | null>(null);

  async function ask(message: string) {
    const query = message.trim();
    if (!query || pending) return;
    setPending(true);
    setInput("");
    try {
      const res = await fetch("/api/crude-oracle-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: query, history: [] }),
      });
      const body = (await res.json()) as Turn & { reply?: string; error?: string };
      setTurns((current) => [
        ...current,
        {
          query,
          reply: body.reply ?? body.error ?? "No reply.",
          trace: body.trace ?? [],
          citations: body.citations ?? [],
          artifact: body.artifact ?? null,
          command: body.command ?? null,
        },
      ]);
    } catch {
      setTurns((current) => [...current, { query, reply: "The desk did not answer.", trace: [], citations: [], artifact: null, command: null }]);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialCommand) void ask(initialCommand);
    // The drawer passes a command once when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCommand]);

  const pinned = [...turns].reverse().find((turn) => turn.artifact)?.artifact ?? null;

  return (
    <div className={`grid min-h-[70vh] ${compact ? "" : "lg:grid-cols-[45%_55%]"}`}>
      <section className="flex flex-col border-border-hairline lg:border-r">
        <div className="flex-1 space-y-4 overflow-auto p-4">
          {turns.length === 0 && <p className="text-sm text-ink-secondary">Slash commands read the published desk. A normal question still uses the Desk Lead. Nothing here is advice.</p>}
          {turns.map((turn, index) => (
            <article key={`${turn.query}-${index}`} className="border border-border-hairline bg-surface-1 p-3">
              <p className="font-mono text-xs text-brass">{turn.query}</p>
              {turn.trace.length > 0 && (
                <button type="button" className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted" onClick={() => setOpenTrace(openTrace === index ? null : index)}>
                  Execution trace · {turn.trace.length} steps
                </button>
              )}
              {openTrace === index && (
                <ol className="mt-2 space-y-1 font-mono text-[11px] text-ink-secondary">
                  {turn.trace.map((step) => (
                    <li key={step.step}>
                      {step.status.toUpperCase()} · {step.step} — {step.detail}
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-primary">{turn.reply}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {turn.citations.map((item) => (
                  <button key={item.id} type="button" className="border border-border-strong px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-secondary" onClick={() => setCitation(item)}>
                    {item.badge} {item.seriesId ?? item.id}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <form
          className="border-t border-border-hairline p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(input);
          }}
        >
          <div className="mb-2 flex flex-wrap gap-1">
            {CHIPS.map((chip) => (
              <button key={chip} type="button" className="border border-border-hairline px-2 py-1 font-mono text-[10px] text-ink-secondary" onClick={() => void ask(chip)}>
                {chip}
              </button>
            ))}
          </div>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Slash command or desk query" className="w-full border border-border-strong bg-canvas px-3 py-2 font-mono text-sm text-ink-primary outline-none" />
        </form>
      </section>
      {!compact && (
        <section className="bg-surface-1 p-4">
          <p className="eyebrow">Pinned artifact</p>
          {!pinned && <p className="mt-3 text-sm text-ink-secondary">A slash command pins a table here. The chart panels on the desk use the same public series.</p>}
          {pinned && (
            <div className="mt-3">
              <h2 className="font-serif text-2xl text-ink-primary">{pinned.title}</h2>
              <p className="mt-1 text-sm text-ink-secondary">{pinned.subtitle}</p>
              <div className="mt-4 overflow-auto">
                <table className="table-dark">
                  <thead>
                    <tr>
                      {pinned.csvColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pinned.csvRows.map((row, index) => (
                      <tr key={index}>
                        {pinned.csvColumns.map((column) => (
                          <td key={column} className="num">
                            {row[column] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="border border-border-strong px-3 py-2 font-mono text-[10px] tracking-[0.08em]"
                  onClick={() => downloadText(`${pinned.id}.csv`, artifactCsv(pinned))}
                >
                  DOWNLOAD CSV
                </button>
                <button
                  type="button"
                  className="border border-border-strong px-3 py-2 font-mono text-[10px] tracking-[0.08em]"
                  onClick={() => {
                    const canvas = document.createElement("canvas");
                    canvas.width = 1200;
                    canvas.height = 200;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.fillStyle = "#101318";
                    ctx.fillRect(0, 0, 1200, 200);
                    ctx.fillStyle = "#ECEEF2";
                    ctx.font = "28px Georgia, serif";
                    ctx.fillText(pinned.title, 24, 64);
                    ctx.font = "16px ui-monospace, monospace";
                    ctx.fillStyle = "#8A94A6";
                    ctx.fillText(pinned.subtitle.slice(0, 120), 24, 100);
                    void downloadWatermarkedPng(canvas, `${pinned.id}.png`, `${pinned.sourceLine} · ${pinned.asOf}`);
                  }}
                >
                  EXPORT PNG
                </button>
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">{pinned.sourceLine} · {pinned.asOf}</p>
            </div>
          )}
          {citation && (
            <div className="mt-6 border border-border-hairline p-3">
              <p className="eyebrow">{citation.badge}</p>
              <p className="mt-2 text-sm text-ink-primary">{citation.source}</p>
              <p className="mt-1 font-mono text-xs text-ink-secondary">
                {citation.seriesId ?? "—"} · {citation.asOf} · {citation.dataType}
                {citation.rawValue ? ` · ${citation.rawValue}` : ""}
              </p>
              {citation.url && (
                <a className="mt-2 inline-block text-sm text-brass" href={citation.url}>
                  Source
                </a>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
