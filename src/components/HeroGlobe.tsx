import Image from "next/image";
import type { ReactNode } from "react";

type HeroGlobeProps = {
  children: ReactNode;
  /** Accessible description of the decorative globe image. */
  imageAlt?: string;
  className?: string;
};

export default function HeroGlobe({
  children,
  imageAlt = "Photorealistic night-side Earth with gold and cyan tanker routes linking continents, oil tankers and offshore rigs on a dark intelligence-terminal background",
  className = "",
}: HeroGlobeProps) {
  return (
    <section className={`relative overflow-hidden border-b border-ink-700 bg-ink-950 ${className}`}>
      <div className="hero-globe" aria-hidden>
        <Image
          src="/images/hero-globe.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-globe__image"
        />
        <div className="hero-globe__routes" />
        <div className="hero-globe__scan" />
        <div className="hero-globe__vignette" />
      </div>
      <span className="sr-only">{imageAlt}</span>
      <div className="container-site relative">{children}</div>
    </section>
  );
}
