import http from "node:http";
import { readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { get, usable, resolvePath } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import { allowedHosts } from "./lib/allowlist.mjs";

const HOST = get("CODA_HOST", "127.0.0.1");
const PORT = Number(get("CODA_PORT", "8787"));
const BIND = String(get("OPERATOR_BIND", "loopback")).toLowerCase();

if (BIND !== "public" && HOST !== "127.0.0.1" && HOST !== "localhost" && HOST !== "::1") {
  log.error(`Refusing to bind ${HOST}: OPERATOR_BIND=loopback allows loopback only. Set OPERATOR_BIND=public (behind Caddy basic-auth) to expose it.`);
  process.exit(78);
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authed(req, url) {
  if (!usable("AGENT_CONSOLE_TOKEN")) return false;
  const token = get("AGENT_CONSOLE_TOKEN");
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const qp = url.searchParams.get("token");
  return (bearer && safeEqual(bearer, token)) || (qp && safeEqual(qp, token));
}

function listDrafts() {
  const dir = resolvePath(get("OUTBOX_DIR", "./outbox"));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const full = path.join(dir, f);
      return { name: f, size: statSync(full).size, mtime: statSync(full).mtime.toISOString() };
    })
    .sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
}

function statusPayload() {
  return {
    service: "coda-console",
    mode: get("CODA_MODE", "dry-run"),
    timezone: get("CODA_TIMEZONE", "Europe/London"),
    bind: `${HOST}:${PORT}`,
    operatorBind: BIND,
    xaiConfigured: usable("XAI_API_KEY"),
    githubConfigured: usable("GITHUB_TOKEN"),
    eiaConfigured: usable("EIA_API_KEY"),
    allowlist: [...allowedHosts()],
    drafts: listDrafts(),
  };
}

function html() {
  const s = statusPayload();
  const badge = (ok) => (ok ? '<span class="ok">configured</span>' : '<span class="off">not set</span>');
  const rows = s.drafts.length
    ? s.drafts.map((d) => `<tr><td>${d.name}</td><td>${d.size} B</td><td>${d.mtime}</td></tr>`).join("")
    : '<tr><td colspan="3">No drafts yet — run <code>bash start.sh --cycle</code>.</td></tr>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CODA Console</title><style>
:root{color-scheme:dark}
body{font:15px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0f14;color:#e6edf3;margin:0;padding:32px}
.wrap{max-width:880px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px} .sub{color:#8b98a5;margin:0 0 24px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 24px}
.card{background:#12181f;border:1px solid #212a33;border-radius:10px;padding:14px}
.k{color:#8b98a5;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.v{font-size:16px;margin-top:4px}
.ok{color:#3fb950;font-weight:600}.off{color:#d29922;font-weight:600}
table{width:100%;border-collapse:collapse;background:#12181f;border:1px solid #212a33;border-radius:10px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #212a33;font-size:13px}
th{color:#8b98a5;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
code{background:#1c242d;padding:2px 6px;border-radius:5px}
.pill{display:inline-block;background:#1c242d;border:1px solid #2a3540;border-radius:999px;padding:3px 10px;font-size:12px;margin:2px 4px 2px 0}
footer{color:#5c6570;font-size:12px;margin-top:24px}
</style></head><body><div class="wrap">
<h1>The Crude Oracle Desk Agent</h1>
<p class="sub">Operator console · ${s.bind} · mode <strong>${s.mode}</strong> · ${s.timezone}</p>
<div class="grid">
<div class="card"><div class="k">xAI / Grok</div><div class="v">${badge(s.xaiConfigured)}</div></div>
<div class="card"><div class="k">GitHub PR</div><div class="v">${badge(s.githubConfigured)}</div></div>
<div class="card"><div class="k">EIA ingest</div><div class="v">${badge(s.eiaConfigured)}</div></div>
</div>
<div class="card" style="margin-bottom:24px"><div class="k">Outbound allowlist</div>
<div class="v">${s.allowlist.map((h) => `<span class="pill">${h}</span>`).join("") || "none"}</div></div>
<h2 style="font-size:16px">Outbox drafts</h2>
<table><thead><tr><th>File</th><th>Size</th><th>Modified</th></tr></thead><tbody>${rows}</tbody></table>
<footer>Loopback-only. Not financial advice. Watchlists are monitored names, not recommendations.</footer>
</div></body></html>`;
}

function send(res, code, type, body) {
  res.writeHead(code, { "content-type": type, "x-content-type-options": "nosniff", "x-frame-options": "DENY" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (url.pathname === "/healthz") {
    // Never echoes the console token.
    return send(res, 200, "application/json", JSON.stringify({ status: "ok", service: "coda-console", mode: get("CODA_MODE", "dry-run") }));
  }
  if (!authed(req, url)) {
    return send(res, 401, "application/json", JSON.stringify({ error: "unauthorized", hint: "append ?token=... or send Authorization: Bearer <AGENT_CONSOLE_TOKEN>" }));
  }
  if (url.pathname === "/api/status") return send(res, 200, "application/json", JSON.stringify(statusPayload(), null, 2));
  if (url.pathname === "/api/drafts") return send(res, 200, "application/json", JSON.stringify(listDrafts(), null, 2));
  if (url.pathname === "/") return send(res, 200, "text/html; charset=utf-8", html());
  return send(res, 404, "application/json", JSON.stringify({ error: "not_found" }));
});

server.listen(PORT, HOST, () => {
  log.info(`CODA console listening on http://${HOST}:${PORT} (operatorBind=${BIND}, mode=${get("CODA_MODE", "dry-run")})`);
  if (!usable("AGENT_CONSOLE_TOKEN")) log.warn("AGENT_CONSOLE_TOKEN not set — all authed routes will return 401 until install.sh generates one.");
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    log.info(`Received ${sig}, shutting down console.`);
    server.close(() => process.exit(0));
  });
}
