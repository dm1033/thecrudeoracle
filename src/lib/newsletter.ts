export type NewsletterConfig =
  | { provider: "beehiiv"; apiKey: string; publicationId: string }
  | { provider: "buttondown"; apiKey: string }
  | { provider: "unconfigured" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 320 && EMAIL.test(email);
}

function real(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "replace_me") return null;
  return trimmed;
}

/**
 * Which list provider to call. Unset, blank, or placeholder keys stay
 * unconfigured so the form can ship before an account exists.
 */
export function newsletterConfig(env: Record<string, string | undefined> = process.env): NewsletterConfig {
  const provider = (env.NEWSLETTER_PROVIDER ?? "").trim().toLowerCase();
  if (provider === "beehiiv") {
    const apiKey = real(env.BEEHIIV_API_KEY);
    const publicationId = real(env.BEEHIIV_PUBLICATION_ID);
    if (apiKey && publicationId) return { provider: "beehiiv", apiKey, publicationId };
  }
  if (provider === "buttondown") {
    const apiKey = real(env.BUTTONDOWN_API_KEY);
    if (apiKey) return { provider: "buttondown", apiKey };
  }
  return { provider: "unconfigured" };
}

export interface SubscribeResult {
  ok: boolean;
  status: "subscribed" | "unconfigured" | "rejected";
}

/** Sends one address to the configured provider. Never throws. */
export async function subscribeEmail(email: string, env: Record<string, string | undefined> = process.env): Promise<SubscribeResult> {
  const config = newsletterConfig(env);
  if (config.provider === "unconfigured") return { ok: true, status: "unconfigured" };

  try {
    if (config.provider === "beehiiv") {
      const res = await fetch(`https://api.beehiiv.com/v2/publications/${config.publicationId}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: "thecrudeoracle",
        }),
        cache: "no-store",
      });
      if (res.ok || res.status === 409) return { ok: true, status: "subscribed" };
      return { ok: false, status: "rejected" };
    }

    const res = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email, tags: ["daily-bottom-line"] }),
      cache: "no-store",
    });
    if (res.ok || res.status === 409) return { ok: true, status: "subscribed" };
    return { ok: false, status: "rejected" };
  } catch {
    return { ok: false, status: "rejected" };
  }
}
