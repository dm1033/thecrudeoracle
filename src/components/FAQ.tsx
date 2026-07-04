export interface FAQItem {
  q: string;
  a: string;
}

/** FAQ section with FAQPage schema.org structured data. */
export default function FAQ({ items, title = "Frequently asked questions" }: { items: FAQItem[]; title?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section aria-label="Frequently asked questions">
      <h2 className="h2">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <details key={item.q} className="card group">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:content-none">
              <span className="mr-2 inline-block text-gold-500 transition-transform group-open:rotate-90" aria-hidden>
                ›
              </span>
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-steel-400">{item.a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </section>
  );
}
