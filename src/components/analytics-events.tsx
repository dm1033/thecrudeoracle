"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect } from "react";

export function TrackOnMount({ name, location }: { name: string; location?: string }) {
  useEffect(() => {
    track(name, location ? { location } : undefined);
  }, [name, location]);
  return null;
}

export function AdvertiseCtaLink({
  href,
  location,
  className,
  rel,
  children,
}: {
  href: string;
  location: string;
  className?: string;
  rel?: string;
  children: React.ReactNode;
}) {
  const onClick = () => track("advertise_cta_click", { location, href });
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} rel={rel} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} rel={rel} onClick={onClick}>
      {children}
    </a>
  );
}

/** Outbound paid placement. `rel="sponsored"` is required on these links. */
export function SponsoredLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      rel="sponsored noopener noreferrer"
      target="_blank"
      onClick={() => track("sponsor_link_click", { href })}
    >
      {children}
    </a>
  );
}

export function NewsletterSignupLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("newsletter_signup_click", { location, href })}
    >
      {children}
    </a>
  );
}
