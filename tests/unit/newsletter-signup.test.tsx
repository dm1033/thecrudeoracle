import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewsletterSignup from "@/components/NewsletterSignup";
import { BEEHIIV_PUBLIC_URL } from "@/lib/newsletter";

vi.mock("@vercel/analytics", () => ({ track: () => undefined }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NewsletterSignup", () => {
  it("links to the beehiiv page and does not error when the list is not configured", () => {
    render(<NewsletterSignup configured={false} heading="Free weekday morning oil brief" />);
    expect(screen.getByRole("heading", { name: "Free weekday morning oil brief" })).toBeTruthy();
    const link = screen.getByRole("link", { name: "Open the beehiiv sign-up page" });
    expect(link.getAttribute("href")).toBe(BEEHIIV_PUBLIC_URL);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("shows the email form when a list is configured", () => {
    render(<NewsletterSignup configured buttonLabel="Get the weekday brief" />);
    expect(screen.getByRole("button", { name: "Get the weekday brief" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open the beehiiv sign-up page" })).toBeNull();
  });

  it("switches to the beehiiv link when the API reports the list is unconfigured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, status: "unconfigured" }), { status: 200 }))
    );
    render(<NewsletterSignup configured />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
    fireEvent.submit(screen.getByLabelText("Email").closest("form") as HTMLFormElement);
    expect(await screen.findByRole("link", { name: "Open the beehiiv sign-up page" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
