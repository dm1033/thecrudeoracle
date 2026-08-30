import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Route smoke test.
 *
 * Two things this is deliberately NOT doing, on purpose (see the task
 * report for why): running a full `next build` per-route (slow, and
 * `npm run build` already does that for the whole app), or rendering the
 * page tree with a browser. Instead:
 *
 *  1. Every `src/app/**\/page.tsx` is dynamically imported through Vite's
 *     own TS/TSX pipeline and must export a default function. This catches
 *     the failure mode that actually bites a route in this codebase: a
 *     page imports one of the hand-edited data/*.json files at module
 *     scope (see src/lib/data.ts and the many `import ... from
 *     "../../../data/x.json"` lines across src/app/tools/*), so a broken
 *     JSON file or a broken import chain throws right here, at import
 *     time, before anything is rendered.
 *  2. sitemap.ts's route list is cross-checked against the real route
 *     tree in both directions, so a route added without a sitemap entry
 *     (or a stale sitemap entry for a route that no longer exists) fails
 *     loudly instead of shipping silently.
 */

const APP_DIR = path.resolve(__dirname, "../../src/app");

function findPageRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Route groups `(name)` don't appear in the URL.
      const segment = entry.startsWith("(") && entry.endsWith(")") ? "" : `/${entry}`;
      routes.push(...findPageRoutes(full, base + segment));
    } else if (entry === "page.tsx" || entry === "page.ts") {
      routes.push(base === "" ? "/" : base);
    }
  }
  return routes;
}

const routes = findPageRoutes(APP_DIR).sort();

// Routes that are deliberately excluded from sitemap.ts: private/auth-gated
// surfaces and pure post-checkout redirect targets that should never be
// indexed or crawled. Anything NOT in this list must appear in the sitemap.
const EXCLUDED_FROM_SITEMAP = new Set(["/admin", "/account", "/payment/cancelled", "/payment/success"]);

describe("route inventory", () => {
  it("found the app's page.tsx routes (sanity check on the walker itself)", () => {
    expect(routes.length).toBeGreaterThan(20);
    expect(routes).toContain("/");
    expect(routes).toContain("/dashboard");
  });

  it("every route file has a default export that is a function (page builds/imports cleanly)", async () => {
    const failures: string[] = [];
    for (const route of routes) {
      const relDir = route === "/" ? "" : route;
      const modPath = path.join(APP_DIR, relDir, "page.tsx");
      try {
        // eslint-disable-next-line no-await-in-loop
        const mod: unknown = await import(/* @vite-ignore */ modPath);
        const Component = (mod as { default?: unknown }).default;
        if (typeof Component !== "function") {
          failures.push(`${route}: default export is not a function (got ${typeof Component})`);
        }
      } catch (err) {
        failures.push(`${route}: threw on import — ${(err as Error).message}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});

describe("sitemap coverage (src/app/sitemap.ts)", () => {
  const sitemapSource = readFileSync(path.join(APP_DIR, "sitemap.ts"), "utf-8");

  // sitemap.ts declares a plain literal ROUTES array of `{ path: "/x", ... }`
  // objects — pull the path strings out with a regex rather than importing
  // the module (importing would also drag in `next` internals we don't
  // need just to read a route list, and this regex is simpler to keep in
  // sync with the file's very stable literal-array shape).
  const sitemapPaths = Array.from(sitemapSource.matchAll(/path:\s*"([^"]+)"/g)).map((m) => m[1]);

  it("parsed at least one route out of sitemap.ts (sanity check on the regex itself)", () => {
    expect(sitemapPaths.length).toBeGreaterThan(20);
  });

  it("every real route is either in the sitemap or explicitly excluded", () => {
    const missing = routes.filter((r) => !EXCLUDED_FROM_SITEMAP.has(r) && !sitemapPaths.includes(r));
    expect(missing, `route(s) exist under src/app but are missing from sitemap.ts: ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("every sitemap entry points at a route that actually exists", () => {
    const stale = sitemapPaths.filter((p) => !routes.includes(p));
    expect(stale, `sitemap.ts lists route(s) with no matching page.tsx: ${stale.join(", ")}`).toEqual([]);
  });

  it("excluded-from-sitemap routes are still real routes (the allowlist itself doesn't drift)", () => {
    const bogus = Array.from(EXCLUDED_FROM_SITEMAP).filter((r) => !routes.includes(r));
    expect(bogus, `EXCLUDED_FROM_SITEMAP names route(s) that don't exist: ${bogus.join(", ")}`).toEqual([]);
  });
});
