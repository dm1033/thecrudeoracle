import { adsText } from "@/lib/advertising";

export const dynamic = "force-static";

/** Absent until an AdSense publisher id is set and advertising consent is on. */
export function GET() {
  const body = adsText();
  if (!body) return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
