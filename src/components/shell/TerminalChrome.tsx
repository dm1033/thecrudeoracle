"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import BrandMark from "@/components/BrandMark";
import DeskTerminal from "@/components/desk-bot/DeskTerminal";
import { CHOKEPOINTS } from "@/lib/chokepoints";

export interface TapeCell {
  label: string;
  value: string;
  delta: string | null;
}

const NAV = [
  { label: "Desk", href: "/" },
  { label: "Daily Note", href: "/daily" },
  { label: "EIA Weekly", href: "/eia-weekly" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tools", href: "/tools" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Research", href: "/research-library" },
  { label: "Desk Bot", href: "/desk-bot" },
];

const ROUTES = [
  ...NAV,
  { label: "Crude prices", href: "/crude-oil-prices" },
  { label: "Gas / LNG", href: "/gas-lng" },
  { label: "OPEC supply", href: "/opec-supply-risk" },
  { label: "Curve monitor", href: "/tools/curve-monitor" },
  { label: "Positioning", href: "/tools/positioning" },
  { label: "Flow map", href: "/tools/flow-map" },
  { label: "Supply news", href: "/tools/supply-news" },
  { label: "Balance engine", href: "/tools/balance-engine" },
  { label: "Data sources", href: "/data-sources" },
];

const ZONES = [
  { id: "UTC", zone: "UTC", label: "UTC" },
  { id: "LDN", zone: "Europe/London", label: "LDN" },
  { id: "NYK", zone: "America/New_York", label: "NYK" },
  { id: "HOU", zone: "America/Chicago", label: "HOU" },
  { id: "SGP", zone: "Asia/Singapore", label: "SGP" },
];

function clock(zone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).format(now);
}

function sessionOpen(zone: string, now: Date): boolean {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: zone }).format(now));
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: zone }).format(now);
  if (day === "Sat" || day === "Sun") return false;
  return hour >= 8 && hour < 17;
}

export default function TerminalChrome({ tape, children }: { tape: TapeCell[]; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
      if (meta && event.key.toLowerCase() === "j") {
        event.preventDefault();
        if (pathname !== "/desk-bot") setDrawer((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  function go(href: string) {
    setPalette(false);
    router.push(href);
  }

  function runCommand(command: string) {
    setPalette(false);
    if (pathname === "/desk-bot") return;
    setQuery(command);
    setDrawer(true);
  }

  return (
    <>
      <div className="no-print sticky top-0 z-40 border-b border-border-hairline bg-canvas">
        <div className="flex h-8 items-stretch overflow-x-auto border-b border-border-hairline">
          {tape.map((cell) => (
            <div key={cell.label} className="flex min-w-[8.5rem] items-center gap-2 border-r border-border-hairline px-3">
              <span className="font-mono text-[10px] tracking-[0.08em] text-ink-muted">{cell.label}</span>
              <span className="num text-xs text-ink-primary">{cell.value}</span>
              {cell.delta && <span className="num text-[10px] text-ink-secondary">{cell.delta}</span>}
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3 px-3">
            <span className="font-mono text-[10px] tracking-[0.08em] text-brass">DELAYED EIA SPOT</span>
            {now &&
              ZONES.map((item) => (
                <span key={item.id} className="flex items-center gap-1 font-mono text-[10px] text-ink-secondary">
                  <span className={`inline-block h-1.5 w-1.5 ${sessionOpen(item.zone, now) ? "bg-bull" : "bg-ink-muted"}`} />
                  {item.label} {clock(item.zone, now)}
                </span>
              ))}
          </div>
        </div>
        <header className="flex h-11 items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-7 w-auto" sizes="32px" />
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-primary">Crude Oracle</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`block border-b-2 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${pathname === item.href ? "border-brass text-brass" : "border-transparent text-ink-secondary"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex gap-2">
            <button type="button" className="border border-border-strong px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-secondary" onClick={() => setPalette(true)}>
              CMD K
            </button>
            {pathname !== "/desk-bot" && (
              <button type="button" className="border border-border-strong px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-secondary" onClick={() => setDrawer(true)}>
                CMD J
              </button>
            )}
          </div>
        </header>
        <nav aria-label="Mobile" className="flex gap-3 overflow-x-auto border-t border-border-hairline px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-ink-secondary">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
      {palette && (
        <div className="fixed inset-0 z-50 bg-canvas/80" onClick={() => setPalette(false)}>
          <div className="mx-auto mt-24 max-w-xl border border-border-strong bg-surface-1" onClick={(event) => event.stopPropagation()}>
            <Command label="Terminal command palette">
              <Command.Input placeholder="Route, series, chokepoint, or slash command" className="w-full border-b border-border-hairline bg-transparent px-3 py-3 font-mono text-sm text-ink-primary outline-none" />
              <Command.List className="max-h-80 overflow-auto p-2">
                <Command.Group heading="Routes">
                  {ROUTES.map((item) => (
                    <Command.Item key={item.href} value={`${item.label} ${item.href}`} onSelect={() => go(item.href)} className="cursor-pointer px-2 py-1.5 text-sm text-ink-secondary aria-selected:bg-surface-3 aria-selected:text-ink-primary">
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Chokepoints">
                  {CHOKEPOINTS.map((item) => (
                    <Command.Item key={item.id} value={item.name} onSelect={() => runCommand(`/chokepoint ${item.id}`)} className="cursor-pointer px-2 py-1.5 text-sm text-ink-secondary aria-selected:bg-surface-3">
                      {item.name}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Desk commands">
                  {["/eia-summary", "/spread brent-wti", "/cot-extremes", "/balance-global"].map((command) => (
                    <Command.Item key={command} value={command} onSelect={() => runCommand(command)} className="cursor-pointer px-2 py-1.5 font-mono text-sm text-brass aria-selected:bg-surface-3">
                      {command}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
      {drawer && pathname !== "/desk-bot" && (
        <aside className="fixed bottom-0 right-0 top-8 z-40 w-full max-w-[460px] border-l border-border-hairline bg-canvas">
          <div className="flex h-11 items-center justify-between border-b border-border-hairline px-3">
            <span className="font-mono text-[10px] tracking-[0.08em] text-brass">DESK BOT</span>
            <button type="button" className="font-mono text-[10px] text-ink-secondary" onClick={() => setDrawer(false)}>
              CLOSE
            </button>
          </div>
          <DeskTerminal initialCommand={query} compact />
        </aside>
      )}
    </>
  );
}
