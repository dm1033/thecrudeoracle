import { revalidatePath, revalidateTag } from "next/cache";
import { cronRequestAllowed } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this around 07:00 Europe/London.
 * Schedules are UTC: 06:00 UTC is 07:00 London during BST, 07:00 UTC is 07:00 London during GMT.
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
  revalidatePath("/daily");
  revalidatePath("/daily/[date]", "page");
  return Response.json({ ok: true, revalidated: ["/daily", "/daily/[date]"] });
}
