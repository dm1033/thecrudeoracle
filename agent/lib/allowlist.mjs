import { readFileSync, existsSync } from "node:fs";
import { get, resolvePath } from "./env.mjs";

let cache = null;

export function allowedHosts() {
  if (cache) return cache;
  const file = resolvePath(get("ALLOWLIST_FILE", "./network/allowlist.txt"));
  const hosts = new Set();
  if (existsSync(file)) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      hosts.add(line.toLowerCase());
    }
  }
  cache = hosts;
  return hosts;
}

export function assertAllowed(urlStr) {
  const host = new URL(urlStr).hostname.toLowerCase();
  if (!allowedHosts().has(host)) {
    const err = new Error(
      `Outbound host not in allowlist: ${host}. Add it to network/allowlist.txt if it is genuinely required.`,
    );
    err.code = "HOST_NOT_ALLOWED";
    throw err;
  }
  return host;
}

// fetch wrapper that enforces the allowlist before any request leaves the box.
export async function guardedFetch(urlStr, opts = {}) {
  assertAllowed(urlStr);
  return fetch(urlStr, opts);
}
