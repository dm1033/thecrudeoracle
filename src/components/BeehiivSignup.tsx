"use client";

import { track } from "@vercel/analytics";
import { useId } from "react";
import { BEEHIIV_PUBLIC_URL } from "@/lib/newsletter";

/**
 * Beehiiv's public subscribe page has no embed and no subscribe call that
 * works without a secret API key. This block only links there.
 */
export default function BeehiivSignup({ location }: { location: string }) {
  const headingId = useId();
  return (
    <section className="rounded-lg border border-gold-600/40 bg-ink-900 p-6 sm:p-8" aria-labelledby={headingId}>
      <p className="eyebrow">Newsletter</p>
      <h2 id={headingId} className="h2 mt-1">
        Get the morning note by email
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-400">
        The Daily Bottom Line is the desk&apos;s beehiiv publication. This button opens beehiiv&apos;s own
        sign-up page in a new tab. This site does not take the email address. Market commentary for
        information only. It is not financial advice.
      </p>
      <a
        href={BEEHIIV_PUBLIC_URL}
        className="btn-primary mt-4 inline-flex"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("newsletter_signup_click", { location, href: BEEHIIV_PUBLIC_URL })}
      >
        Open the beehiiv sign-up page
      </a>
      <p className="mt-3 text-xs text-steel-500">
        Sign-up page:{" "}
        <a href={BEEHIIV_PUBLIC_URL} className="text-gold-400 underline" target="_blank" rel="noopener noreferrer">
          {BEEHIIV_PUBLIC_URL}
        </a>
      </p>
    </section>
  );
}
