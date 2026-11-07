"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
  CRUDE_ORACLE_PROMPT_VERSION,
  CRUDE_ORACLE_QUICK_PROMPTS,
  type AgentChatMessage,
} from "@/lib/crude-oracle-agent";

function formatInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return (
        <em key={idx} className=" italic text-steel-400">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={idx} className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-xs text-gold-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdownBlocks(markdown: string): React.ReactNode {
  const blocks = markdown.trim().split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-steel-300">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n");

        if (lines[0]?.startsWith("### ")) {
          return (
            <h4
              key={bIdx}
              className="mt-4 border-b border-ink-700 pb-1 text-xs font-bold uppercase tracking-wider text-gold-400"
            >
              {lines[0].replace(/^###\s+/, "")}
            </h4>
          );
        }

        if (lines[0]?.startsWith("> ")) {
          const text = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
          return (
            <div
              key={bIdx}
              className="rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs text-gold-300"
            >
              {formatInline(text)}
            </div>
          );
        }

        if (lines[0]?.trim() === "---") {
          return <hr key={bIdx} className="border-ink-700" />;
        }

        // Markdown table
        if (lines.length >= 2 && lines[0].includes("|") && lines[1].includes("---")) {
          const headers = lines[0]
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean);
          const rows = lines.slice(2).map((row) =>
            row
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean)
          );
          return (
            <div key={bIdx} className="overflow-x-auto rounded-md border border-ink-700 bg-ink-950/90">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="border-b border-ink-700 bg-ink-900 text-[11px] uppercase tracking-wider text-steel-400">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-2.5 py-2 font-semibold">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {rows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-ink-900/50">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2.5 py-2 align-top text-steel-300">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Bullet list
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-4 list-disc marker:text-gold-400">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="text-xs sm:text-sm text-steel-300">
                  {formatInline(l.trim().replace(/^-\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bIdx} className="text-xs sm:text-sm text-steel-300">
            {formatInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}

export default function CrudeOracleBot({
  mode = "floating",
  initialReply,
  initialEiaLive = false,
}: {
  mode?: "floating" | "embedded";
  initialReply?: string;
  initialEiaLive?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(mode === "embedded");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusLabel, setFocusLabel] = useState("Crude & Global Barrel Complex");
  const [eiaLive, setEiaLive] = useState(initialEiaLive);
  const [messages, setMessages] = useState<AgentChatMessage[]>(() =>
    initialReply ? [{ role: "assistant", content: initialReply }] : []
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode === "embedded") setOpen(true);
  }, [mode]);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/crude-oracle-agent")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.initialBriefing?.reply) return;
        setMessages([{ role: "assistant", content: data.initialBriefing.reply }]);
        setEiaLive(Boolean(data.eiaLive));
        if (data.initialBriefing.focus) setFocusLabel(data.initialBriefing.focus);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, messages.length]);

  useEffect(() => {
    if (open && messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages.length, open]);

  if (mode === "floating" && pathname === "/desk-agent") {
    return null;
  }

  async function submitQuery(queryText: string) {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;
    const nextHistory: AgentChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/crude-oracle-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: messages }),
      });
      const data = await res.json();
      if (res.ok && data?.reply) {
        setMessages([...nextHistory, { role: "assistant", content: data.reply }]);
        if (data.focus) setFocusLabel(data.focus);
        if (typeof data.eiaLive === "boolean") setEiaLive(data.eiaLive);
      } else {
        setMessages([
          ...nextHistory,
          {
            role: "assistant",
            content: `### Desk Alert\nUnable to retrieve fresh desk response (${data?.error ?? "service error"}). Verify figures directly on the dashboard.\n\n---\n\n**Disclaimer:** Information only — not investment advice.`,
          },
        ]);
      }
    } catch {
      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: `### Desk Alert\nNetwork error reaching the CrudeOracle desk endpoint. No numbers invented — check \`/dashboard\` or \`/daily\` for the last published EIA prints.\n\n---\n\n**Disclaimer:** Information only — not investment advice.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPrompt() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  }

  const panelContent = (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-gold-600/50 bg-ink-950 shadow-2xl shadow-black/80 ${
        mode === "embedded"
          ? "min-h-[680px]"
          : "fixed bottom-4 right-4 z-50 h-[min(82vh,720px)] w-[min(94vw,560px)]"
      }`}
      role="region"
      aria-label="CrudeOracle Desk Lead Onscreen Bot"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-700 bg-ink-900 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gain shadow-[0_0_8px_#22c55e]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-white">CrudeOracle — Desk Lead</span>
              <span className="rounded border border-gold-500/40 bg-gold-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gold-400">
                v{CRUDE_ORACLE_PROMPT_VERSION}
              </span>
            </div>
            <p className="text-[11px] text-steel-400">
              Focus: <span className="font-semibold text-steel-200">{focusLabel}</span> ·{" "}
              {eiaLive ? "EIA Spot Overlay Active" : "Published Desk Marks (Delayed)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPromptModal((v) => !v)}
            className="rounded border border-ink-600 bg-ink-800 px-2 py-1 text-[11px] font-medium text-steel-300 hover:border-gold-500 hover:text-white"
          >
            {showPromptModal ? "Back to Terminal" : "System Prompt"}
          </button>
          {mode === "floating" && (
            <>
              <Link
                href="/desk-agent"
                className="rounded border border-ink-600 bg-ink-800 px-2 py-1 text-[11px] font-medium text-gold-400 hover:border-gold-400"
              >
                Full Screen ↗
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close CrudeOracle Desk Bot"
                className="rounded border border-ink-600 bg-ink-800 px-2 py-1 text-xs font-bold text-steel-300 hover:border-gold-500 hover:text-white"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* System Prompt Inspector View */}
      {showPromptModal ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-950">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Master System Prompt · Version 30 Oct 2026</p>
              <h3 className="text-sm font-bold text-white">
                CrudeOracle Investment Agent — Onscreen Bot Specification
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="rounded bg-gold-500 px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-400"
            >
              {copiedPrompt ? "Copied ✓" : "Copy System Prompt"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-ink-700 bg-ink-900 p-3 font-mono text-xs leading-relaxed text-steel-300">
            {CRUDE_ORACLE_MASTER_SYSTEM_PROMPT}
          </pre>
        </div>
      ) : (
        <>
          {/* Quick Interactive Drill-Down Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-ink-800 bg-ink-900/60 px-3 py-2">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-steel-500">
              Desk Drills:
            </span>
            {CRUDE_ORACLE_QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={loading}
                onClick={() => submitQuery(item.query)}
                className="shrink-0 rounded border border-ink-700 bg-ink-800/90 px-2.5 py-1 text-[11px] font-medium text-steel-300 transition-colors hover:border-gold-500/60 hover:text-gold-300 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3.5 ${
                  msg.role === "user"
                    ? "ml-6 border-gold-600/40 bg-ink-900 text-white"
                    : "border-ink-700 bg-ink-900/50"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-steel-500">
                  <span>{msg.role === "user" ? "Client / Trader Query" : "CrudeOracle · Desk Lead"}</span>
                  <span>{msg.role === "assistant" ? "Sourced · Non-Advisory" : ""}</span>
                </div>
                {msg.role === "user" ? (
                  <p className="text-sm font-medium text-white">{msg.content}</p>
                ) : (
                  renderMarkdownBlocks(msg.content)
                )}
              </div>
            ))}
            {loading && (
              <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-3 text-xs font-mono text-gold-400">
                Pulling verified EIA/desk prints, checking CFTC COT &amp; S&amp;D balances…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitQuery(input);
            }}
            className="border-t border-ink-700 bg-ink-900 p-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Desk Lead: Brent/WTI tape, inventories, Hormuz, COT crowding, majors…"
                aria-label="Ask CrudeOracle Desk Lead"
                className="flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-steel-500 focus:border-gold-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-md bg-gold-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
              >
                Brief Me
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-steel-500">
              Information only — not investment advice. Every print carries source, as-of date &amp; delay label.
            </p>
          </form>
        </>
      )}
    </div>
  );

  if (mode === "embedded") {
    return panelContent;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open CrudeOracle Desk Lead Bot"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full border border-gold-500 bg-ink-950/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-black/80 transition-transform hover:scale-[1.02] hover:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-gain shadow-[0_0_8px_#22c55e]" />
          <span>CrudeOracle Desk Bot</span>
          <span className="rounded bg-gold-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-950">
            LIVE
          </span>
        </button>
      )}
      {open && panelContent}
    </>
  );
}
