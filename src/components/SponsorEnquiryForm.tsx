"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { GENERAL_ENQUIRY_ID } from "@/lib/sponsor-enquiry";
import { SITE } from "@/lib/site";

export interface EnquirySlot {
  id: string;
  name: string;
  placement: string;
  price: string;
  available: boolean;
}

const inputClass =
  "mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-steel-500";

export default function SponsorEnquiryForm({ slots, source }: { slots: EnquirySlot[]; source: string }) {
  const baseId = useId();
  const ordered = useMemo(() => {
    const open = slots.filter((slot) => slot.available);
    const closed = slots.filter((slot) => !slot.available);
    return [...open, ...closed];
  }, [slots]);
  const [slotId, setSlotId] = useState(ordered.find((slot) => slot.available)?.id ?? GENERAL_ENQUIRY_ID);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const [mailto, setMailto] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "").split(/[?&]/)[0];
    const query = new URLSearchParams(window.location.search).get("slot");
    const id = query || hash;
    if (id && ordered.some((slot) => slot.id === id)) setSlotId(id);
  }, [ordered]);

  const chosen = ordered.find((slot) => slot.id === slotId);
  const fallbackMailto = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
    `Sponsorship enquiry: ${chosen?.name ?? "General enquiry"}`,
  )}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("company") ?? "").trim()) {
      setStatus("sent");
      return;
    }
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      organisation: String(data.get("organisation") ?? ""),
      slotId,
      months: String(data.get("months") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/sponsor-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { ok?: boolean; delivery?: string; href?: string; error?: string };
      if (body.delivery === "sent") {
        setStatus("sent");
        return;
      }
      if (body.delivery === "mailto" && body.href) {
        setMailto(body.href);
        setStatus("mailto");
        window.location.href = body.href;
        return;
      }
      setError(body.error || "The enquiry could not be sent.");
      setStatus("error");
    } catch {
      setStatus("error");
      setError("The enquiry could not be sent.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" aria-describedby={`${baseId}-note`}>
      <p className="eyebrow">Enquiry</p>
      <h2 className="h2">Ask about a slot</h2>
      <p id={`${baseId}-note`} className="text-sm leading-relaxed text-steel-400">
        Choose the slot. You do not retype its name. Sponsored placements stay labelled and separate from the prices and the note.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${baseId}-name`} className={labelClass}>
            Name
          </label>
          <input id={`${baseId}-name`} name="name" required autoComplete="name" className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor={`${baseId}-email`} className={labelClass}>
            Email
          </label>
          <input id={`${baseId}-email`} name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor={`${baseId}-org`} className={labelClass}>
            Organisation
          </label>
          <input id={`${baseId}-org`} name="organisation" autoComplete="organization" className={inputClass} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor={`${baseId}-months`} className={labelClass}>
            Months
          </label>
          <select id={`${baseId}-months`} name="months" className={inputClass} defaultValue="1">
            <option value="">Not sure yet</option>
            <option value="1">1 month</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${baseId}-slot`} className={labelClass}>
          Slot
        </label>
        <select
          id={`${baseId}-slot`}
          name="slotId"
          required
          value={slotId}
          onChange={(event) => setSlotId(event.target.value)}
          className={inputClass}
        >
          <option value={GENERAL_ENQUIRY_ID}>General enquiry</option>
          {ordered.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.name} — {slot.price}
              {slot.available ? "" : " — not yet placed"}
            </option>
          ))}
        </select>
        {chosen ? <p className="mt-2 text-xs leading-relaxed text-steel-500">Appears on {chosen.placement}.</p> : null}
      </div>
      <div>
        <label htmlFor={`${baseId}-message`} className={labelClass}>
          Message
        </label>
        <textarea id={`${baseId}-message`} name="message" required rows={5} className={inputClass} placeholder="Who you are, and what you want the placement to say." />
      </div>
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor={`${baseId}-company`}>Company</label>
        <input id={`${baseId}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === "sent" ? (
        <p role="status" className="rounded border border-gain/60 bg-gain/10 p-3 text-xs text-gain">
          Received. The desk will reply to the email you gave. If you do not hear back, write to {SITE.contactEmail}.
        </p>
      ) : null}
      {status === "mailto" ? (
        <p role="status" className="rounded border border-gold-600/50 bg-ink-950 p-3 text-xs text-steel-300">
          Your email app should have opened with this enquiry filled in, including the slot. If it did not,{" "}
          <a className="text-gold-400 underline" href={mailto || fallbackMailto}>
            open the email
          </a>
          .
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="rounded border border-ink-600 bg-ink-950 p-3 text-xs text-steel-300">
          {error} You can still{" "}
          <a className="text-gold-400 underline" href={fallbackMailto}>
            email {SITE.contactEmail}
          </a>
          .
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={status === "sending"} data-source={source}>
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-xs leading-relaxed text-steel-500">
        Or email{" "}
        <a className="text-gold-400 underline" href={fallbackMailto}>
          {SITE.contactEmail}
        </a>
        . The address is the fallback when the form service is not configured. We use these details only to reply. See the privacy policy.
      </p>
    </form>
  );
}
