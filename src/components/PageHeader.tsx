export default function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="border-b border-ink-700 bg-ink-900">
      <div className="container-site py-10 sm:py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {intro && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-steel-400 sm:text-base">{intro}</p>}
      </div>
    </div>
  );
}
