"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { NAV_MAIN, SITE } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <BrandMark priority className="h-11 w-auto" />
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-white">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          <ul className="flex items-center gap-1">
            {NAV_MAIN.slice(0, 8).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950 ${
                    pathname === item.href
                      ? "bg-ink-800 text-gold-400"
                      : "text-steel-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.premium && (
                    <span aria-hidden className="ml-1 text-[9px] font-bold uppercase text-gold-500">★</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/login" className="px-3 py-1.5 text-xs font-medium text-steel-400 hover:text-white">
            Login
          </Link>
          <Link
            href="/subscribe"
            className="rounded-md bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            100% Free — No Paywall
          </Link>
        </div>

        <button
          type="button"
          className="rounded border border-ink-600 p-2 text-steel-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
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
        <nav id="mobile-nav" className="border-t border-ink-700 bg-ink-900 xl:hidden" aria-label="Mobile navigation">
          <ul className="container-site grid grid-cols-2 gap-1 py-4 sm:grid-cols-3">
            {NAV_MAIN.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`block rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-900 ${
                    pathname === item.href ? "bg-ink-800 text-gold-400" : "text-steel-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.premium && <span aria-hidden className="ml-1 text-[9px] font-bold text-gold-500">★</span>}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded px-3 py-2 text-sm text-steel-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-900">
                Login
              </Link>
            </li>
            <li>
              <Link href="/account" onClick={() => setOpen(false)} className="block rounded px-3 py-2 text-sm text-steel-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-900">
                Account
              </Link>
            </li>
          </ul>
          <div className="container-site pb-4">
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="block rounded-md bg-gold-500 px-4 py-3 text-center text-sm font-semibold text-ink-950 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-900"
            >
              100% Free — No Paywall
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
