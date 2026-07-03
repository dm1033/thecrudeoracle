"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_MAIN, SITE } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded bg-gold-500 font-mono text-sm font-bold text-ink-950">
            CO
          </span>
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-white">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {NAV_MAIN.slice(0, 8).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                pathname === item.href
                  ? "bg-ink-800 text-gold-400"
                  : "text-steel-400 hover:text-white"
              }`}
            >
              {item.label}
              {item.premium && (
                <span className="ml-1 text-[9px] font-bold uppercase text-gold-500">★</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/login" className="px-3 py-1.5 text-xs font-medium text-steel-400 hover:text-white">
            Login
          </Link>
          <Link
            href="/subscribe"
            className="rounded-md bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Subscribe — {SITE.price}{SITE.priceSuffix}
          </Link>
        </div>

        <button
          type="button"
          className="rounded border border-ink-600 p-2 text-steel-300 xl:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-700 bg-ink-900 xl:hidden" aria-label="Mobile navigation">
          <div className="container-site grid grid-cols-2 gap-1 py-4 sm:grid-cols-3">
            {NAV_MAIN.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-ink-800 text-gold-400" : "text-steel-400 hover:text-white"
                }`}
              >
                {item.label}
                {item.premium && <span className="ml-1 text-[9px] font-bold text-gold-500">★</span>}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm text-steel-400 hover:text-white">
              Login
            </Link>
            <Link href="/account" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm text-steel-400 hover:text-white">
              Account
            </Link>
          </div>
          <div className="container-site pb-4">
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="block rounded-md bg-gold-500 px-4 py-3 text-center text-sm font-semibold text-ink-950"
            >
              Subscribe — {SITE.price}{SITE.priceSuffix}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
