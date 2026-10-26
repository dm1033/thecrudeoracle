/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when that env var
 * is set on the project. The secret is optional: a build and a deploy must
 * succeed without it, and the revalidate route still runs.
 */
export function cronRequestAllowed(authorization: string | null, secret: string | undefined): boolean {
  const trimmed = secret?.trim() ?? "";
  if (!trimmed) return true;
  return authorization === `Bearer ${trimmed}`;
}
