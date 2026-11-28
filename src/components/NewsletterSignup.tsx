"use client";

import { track } from "@vercel/analytics";
import { useId, useState } from "react";
import { BEEHIIV_PUBLIC_URL } from "@/lib/newsletter";
import { SITE } from "@/lib/site";

type Status = "idle" | "sending" | "subscribed" | "unconfigured" | "error";

const DEFAULT_EYEBROW = "The Daily Bottom Line";
const DEFAULT_HEADING = "The trading day's bottom line, by email";
const DEFAULT_BODY =
  "One note on trading days: what moved, why, and what matters next. Market commentary for information only. It is not financial advice.";

/**
 * On-site beehiiv form. When the API key or publication id is missing,
 * `configured` is false and the box links to beehiiv's own page.
 */
export default function NewsletterSignup({
  configured,
  location = "site_form",
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  body = DEFAULT_BODY,
  buttonLabel = "Get the Daily Bottom Line",
}: {
  configured: boolean;
  location?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  buttonLabel?: string;
}) {
  const emailId = useId();
  const headingId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const showLink = !configured || status === "unconfigured";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    const form = event.currentTarget;
    const honeypot = String(new FormData(form).get("company") ?? "");
    if (honeypot) {
      setStatus("subscribed");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json()) as { status?: string };
      if (res.ok && payload.status === "subscribed") setStatus("subscribed");
      else if (res.ok && payload.status === "unconfigured") setStatus("unconfigured");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-gold-600/40 bg-ink-900 p-6 sm:p-8" aria-labelledby={headingId}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={headingId} className="h2 mt-1">
        {heading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-400">{body}</p>
      {status === "subscribed" ? (
        <p className="mt-4 text-sm font-semibold text-gold-300" role="status">
          You&apos;re on the list for The Daily Bottom Line.
        </p>
      ) : showLink ? (
        <>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-400">
            This button opens beehiiv&apos;s own sign-up page. This site does not take the email address.
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
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950"
            />
          </div>
          <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor={`${emailId}-company`}>Company</label>
            <input id={`${emailId}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={status === "sending"}
            onClick={() => track("newsletter_signup_click", { location })}
          >
            {status === "sending" ? "Adding…" : buttonLabel}
          </button>
        </form>
      )}
      {status === "error" ? (
        <p className="mt-3 text-sm text-loss" role="alert">
          That email could not be added. Try again, or write to {SITE.contactEmail}.
        </p>
      ) : null}
    </section>
  );
}
