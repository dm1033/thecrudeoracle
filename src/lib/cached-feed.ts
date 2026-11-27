import { unstable_cache } from "next/cache";
import { EIA_DATA_REVALIDATE_SECONDS } from "@/lib/eia";

interface Entry<T> {
  at: number;
  value: T;
}

/**
 * Last good payload for one upstream read.
 * A warm copy is returned immediately. A due copy is returned and refreshed
 * behind the page. A cold miss waits on `load`, which must time itself out.
 * A thrown load is not stored, so a failure does not become the next success.
 */
export function cachedFeed<T>(opts: {
  key: string;
  tags: string[];
  load: () => Promise<T>;
  revalidate?: number;
}): { get: () => Promise<T | null>; reset: () => void } {
  const revalidate = opts.revalidate ?? EIA_DATA_REVALIDATE_SECONDS;
  const ttl = revalidate * 1000;
  let memory: Entry<T> | null = null;
  let pending: Promise<T> | null = null;
  let epoch = 0;

  const cached = unstable_cache(opts.load, [opts.key], { revalidate, tags: opts.tags });

  function refresh(token: number): Promise<T> {
    if (pending) return pending;
    const run = (async () => {
      try {
        return await cached();
      } catch (err) {
        if (err instanceof Error && err.message.includes("incrementalCache missing")) return opts.load();
        throw err;
      }
    })()
      .then((value) => {
        if (token === epoch) memory = { at: Date.now(), value };
        return value;
      })
      .finally(() => {
        if (pending === run) pending = null;
      });
    pending = run;
    return run;
  }

  async function get(): Promise<T | null> {
    const token = epoch;
    if (memory) {
      if (Date.now() - memory.at >= ttl) void refresh(token).catch(() => {});
      return memory.value;
    }
    try {
      return await refresh(token);
    } catch {
      const saved = memory as Entry<T> | null;
      return saved && token === epoch ? saved.value : null;
    }
  }

  return {
    get,
    reset() {
      epoch += 1;
      memory = null;
      pending = null;
    },
  };
}
