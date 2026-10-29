"use client";

import { track } from "@vercel/analytics";
import { useId } from "react";
import { BEEHIIV_PUBLIC_URL } from "@/lib/newsletter";

/** Inline sign-up that posts to the publication URL already used by the daily note. */
export default function BeehiivSignup({ location }: { location: string }) {
  const emailId = useId();
  return (
    <section className="rounded-lg border border-gold-600/40 bg-ink-900 p-6 sm:p-8" aria-labelledby={`${emailId}-heading`}>
      <p className="eyebrow">Newsletter</p>
      <h2 id={`${emailId}-heading`} className="h2 mt-1">
        Get the morning note by email
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-400">
        The Daily Bottom Line is the desk&apos;s beehiiv publication. This form opens that sign-up
        page. Market commentary for information only. It is not financial advice.
      </p>
      <form
        action={BEEHIIV_PUBLIC_URL}
        method="get"
        target="_blank"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={() => track("newsletter_signup_click", { location, href: BEEHIIV_PUBLIC_URL })}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-wide text-steel-500">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950"
          />
        </div>
        <button type="submit" className="btn-primary">
          Subscribe
        </button>
      </form>
      <p className="mt-3 text-xs text-steel-500">
        Sign-up page:{" "}
        <a href={BEEHIIV_PUBLIC_URL} className="text-gold-400 underline" target="_blank" rel="noopener noreferrer">
          {BEEHIIV_PUBLIC_URL}
        </a>
      </p>
    </section>
  );
}
