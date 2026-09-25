import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PageHeader from "@/components/PageHeader";

afterEach(cleanup);

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} className={props.className} />
  ),
}));

describe("PageHeader", () => {
  it("renders the plain terminal header by default", () => {
    const { container } = render(
      <PageHeader eyebrow="Free Market Snapshot" title="Daily Oil Dashboard" intro="A free daily snapshot." />
    );
    expect(screen.getByRole("heading", { name: "Daily Oil Dashboard" })).toBeTruthy();
    expect(container.querySelector(".hero-globe")).toBeNull();
  });

  it("renders the cinematic globe atmosphere when requested", () => {
    const { container } = render(
      <PageHeader
        atmosphere="globe"
        eyebrow="Trader Toolkit · Module 2"
        title="Physical Flow Map"
        intro="Tankers loaded and discharged."
      />
    );
    expect(screen.getByRole("heading", { name: "Physical Flow Map" })).toBeTruthy();
    expect(container.querySelector(".hero-globe")).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/images/hero-globe.jpg");
  });
});
