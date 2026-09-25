import HeroGlobe from "@/components/HeroGlobe";

export default function PageHeader({
  eyebrow,
  title,
  intro,
  atmosphere = "plain",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  /** `globe` uses the cinematic tanker-route Earth behind the title. */
  atmosphere?: "plain" | "globe";
}) {
  const copy = (
    <div
      className={
        atmosphere === "globe"
          ? "hero-globe__copy py-10 sm:py-16"
          : "container-site py-10 sm:py-14"
      }
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {intro && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-steel-400 sm:text-base">{intro}</p>
      )}
    </div>
  );

  if (atmosphere === "globe") {
    return <HeroGlobe>{copy}</HeroGlobe>;
  }

  return <div className="border-b border-ink-700 bg-ink-900">{copy}</div>;
}
