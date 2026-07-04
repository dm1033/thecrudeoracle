"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const ROLES = ["Investor", "Trader", "Professional", "Other"] as const;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "Investor",
    subscriptionQuestion: "",
    message: "",
  });

  function update(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm({ ...form, [field]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // FORM BACKEND PLACEHOLDER:
    // Wire to Formspree, Netlify Forms, Resend, or an API route before launch.
    // As a functional fallback we open the visitor's mail client pre-filled.
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Company: ${form.company}`,
      `Role: ${form.role}`,
      `Subscription question: ${form.subscriptionQuestion}`,
      "",
      form.message,
    ].join("\n");
    window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
      "Premium Intelligence Enquiry — The Crude Oracle"
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-steel-500";

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={labelClass}>
            Name
          </label>
          <input id="c-name" required value={form.name} onChange={update("name")} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="c-email" className={labelClass}>
            Email
          </label>
          <input id="c-email" type="email" required value={form.email} onChange={update("email")} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="c-company" className={labelClass}>
            Company
          </label>
          <input id="c-company" value={form.company} onChange={update("company")} className={inputClass} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="c-role" className={labelClass}>
            I am an…
          </label>
          <select id="c-role" value={form.role} onChange={update("role")} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="c-subq" className={labelClass}>
          Subscription question
        </label>
        <input id="c-subq" value={form.subscriptionQuestion} onChange={update("subscriptionQuestion")} className={inputClass} placeholder="e.g. team access, billing, coverage" />
      </div>
      <div>
        <label htmlFor="c-msg" className={labelClass}>
          Message
        </label>
        <textarea id="c-msg" required rows={5} value={form.message} onChange={update("message")} className={inputClass} placeholder="How can we help?" />
      </div>

      {submitted && (
        <p className="rounded border border-gain/40 bg-gain/10 p-3 text-xs text-gain">
          Thank you — your email client should have opened with your enquiry. If not, email us
          directly at {SITE.contactEmail}.
        </p>
      )}

      <button type="submit" className="btn-primary w-full">
        Request Access / Ask About Premium Intelligence
      </button>
      <p className="text-center text-[11px] text-steel-500">
        We use your details only to respond to your enquiry. See the Privacy Policy.
      </p>
    </form>
  );
}
