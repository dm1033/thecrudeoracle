import { revalidatePath, revalidateTag } from "next/cache";
import { cronRequestAllowed } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this around 07:00 Europe/London, and again on Wednesday at 15:45 UTC
 * so the Weekly Petroleum Status Report is picked up after 15:30 UTC (10:30 a.m. US Eastern
 * in winter, an hour after the summer release).
 * Morning schedules are UTC: 06:00 UTC is 07:00 London during BST, 07:00 UTC is 07:00 London during GMT.
 * Weekday 22:30 UTC is after the US afternoon, so a spot EIA posts that evening is on the site
 * before the next London morning. The route only clears the cache. It does not write a price.
 * When CRON_SECRET is set, the caller must send Authorization: Bearer <CRON_SECRET>.
 * When it is unset, the route still revalidates so the project does not need a new secret to build or run.
 */
export async function GET(request: Request) {
  if (!cronRequestAllowed(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag("daily-note");
  revalidateTag("eia-spot");
  revalidateTag("eia-brent-wti");
  revalidateTag("eia-weekly");
  revalidatePath("/daily");
  revalidatePath("/daily/[date]", "page");
  revalidatePath("/eia-weekly");
  revalidatePath("/");
  return Response.json({ ok: true, revalidated: ["/", "/daily", "/daily/[date]", "/eia-weekly"] });
}
