"use client";

import { track } from "@vercel/analytics";
import { useId, useState } from "react";
import { SITE } from "@/lib/site";

type Status = "idle" | "sending" | "subscribed" | "unconfigured" | "error";

export default function NewsletterSignup() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const body = (await res.json()) as { status?: string };
      if (res.ok && body.status === "subscribed") setStatus("subscribed");
      else if (res.ok && body.status === "unconfigured") setStatus("unconfigured");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-gold-600/40 bg-ink-900 p-6 sm:p-8" aria-labelledby="dbl-heading">
      <p className="eyebrow">The Daily Bottom Line</p>
      <h2 id="dbl-heading" className="h2 mt-1">
        The trading day&apos;s bottom line, by email
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-400">
        One note on trading days: what moved, why, and what matters next. Market commentary for
        information only. It is not financial advice.
      </p>
      {status === "subscribed" ? (
        <p className="mt-4 text-sm font-semibold text-gold-300" role="status">
          You&apos;re on the list for The Daily Bottom Line.
        </p>
      ) : status === "unconfigured" ? (
        <p className="mt-4 text-sm leading-relaxed text-steel-300" role="status">
          The email list is not open yet. Write to{" "}
          <a className="text-gold-400 underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>{" "}
          and ask to be added to The Daily Bottom Line.
        </p>
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
            onClick={() => track("newsletter_signup_click", { location: "site_form" })}
          >
            {status === "sending" ? "Adding…" : "Get the Daily Bottom Line"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-loss" role="alert">
          That email could not be added. Try again, or write to {SITE.contactEmail}.
        </p>
      )}
    </section>
  );
}
