import { get } from "./env.mjs";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold() {
  return LEVELS[String(get("CODA_LOG_LEVEL", "info")).toLowerCase()] ?? LEVELS.info;
}

// Redact anything that looks like a secret so tokens never reach stdout/logs.
const SECRET_RE = /(xai-[A-Za-z0-9_-]{6,}|gh[pousr]_[A-Za-z0-9]{6,}|[A-Fa-f0-9]{32,})/g;
function redact(s) {
  return String(s).replace(SECRET_RE, "[REDACTED]");
}

function emit(level, args) {
  if (LEVELS[level] < threshold()) return;
  const ts = new Date().toISOString();
  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  const out = `${ts} [${level.toUpperCase()}] ${redact(line)}`;
  (level === "error" || level === "warn" ? process.stderr : process.stdout).write(out + "\n");
}

export const log = {
  debug: (...a) => emit("debug", a),
  info: (...a) => emit("info", a),
  warn: (...a) => emit("warn", a),
  error: (...a) => emit("error", a),
  redact,
};
