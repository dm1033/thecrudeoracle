import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const PLACEHOLDER = new Set(["", "replace_me", "REPLACE_ME", "changeme"]);

function parseEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// secrets/.env wins, then real process.env, then baked defaults.
const fileEnv = parseEnvFile(path.join(ROOT, "secrets", ".env"));

const DEFAULTS = {
  XAI_API_BASE: "https://api.x.ai/v1",
  XAI_MODEL: "grok-4",
  GITHUB_OWNER: "dm1033",
  GITHUB_SITE_REPO: "thecrudeoracle",
  GITHUB_DESK_REPO: "thecrudeoracle-desk",
  CODA_HOST: "127.0.0.1",
  CODA_PORT: "8787",
  OPERATOR_BIND: "loopback",
  OUTBOX_DIR: "./outbox",
  PROMPT_DIR: "./prompts",
  ALLOWLIST_FILE: "./network/allowlist.txt",
  CODA_MODE: "dry-run",
  CODA_TIMEZONE: "Europe/London",
  CODA_LOG_LEVEL: "info",
};

export function get(key, fallback) {
  const v = fileEnv[key] ?? process.env[key] ?? DEFAULTS[key] ?? fallback;
  return v;
}

// A "usable" value is present and not a placeholder like replace_me.
export function usable(key) {
  const v = get(key, "");
  return v != null && !PLACEHOLDER.has(String(v).trim());
}

export function requireUsable(key, hint) {
  if (!usable(key)) {
    const msg = `Missing required secret ${key}${hint ? ` — ${hint}` : ""}. Set it in secrets/.env (never commit it).`;
    const err = new Error(msg);
    err.code = "MISSING_SECRET";
    throw err;
  }
  return get(key);
}

export function resolvePath(p) {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.resolve(ROOT, p);
}
