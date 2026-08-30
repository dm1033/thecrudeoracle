import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import ContactForm from "./ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Contact — The Crude Oracle",
  "Contact The Crude Oracle with questions about the data, coverage requests or general feedback. The site is 100% free — no subscription or account is required.",
  "/contact"
);

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get In Touch"
        title="Contact"
        intro="Questions about the data, coverage or anything else on the site — we respond to serious enquiries quickly."
      />
      <div className="container-site py-10">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Direct</h2>
              <p className="mt-3 text-sm text-steel-400">
                Email:{" "}
                <a href={`mailto:${SITE.contactEmail}`} className="text-gold-400 underline">
                  {SITE.contactEmail}
                </a>
              </p>
              <p className="mt-2 text-xs text-steel-500">
                (Placeholder address — configure your real inbox before launch.)
              </p>
            </div>
            <div className="card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">
                What we can help with
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-steel-400">
                <li>· Data and source questions</li>
                <li>· Coverage requests</li>
                <li>· Partnership or media enquiries</li>
                <li>· General feedback</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
