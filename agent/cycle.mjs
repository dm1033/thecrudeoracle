import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { get, resolvePath } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import { gatherContext } from "./lib/context.mjs";
import { generateDraft } from "./lib/xai.mjs";
import { publishDraft } from "./publish.mjs";

function ts() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function loadPrompt() {
  const dir = resolvePath(get("PROMPT_DIR", "./prompts"));
  const file = path.join(dir, "desk-draft.md");
  if (!existsSync(file)) return "Write a concise daily desk note for The Crude Oracle.";
  return readFileSync(file, "utf8");
}

export async function runCycle({ publish = false } = {}) {
  const mode = publish ? "publish" : "dry-run";
  log.info(`Starting CODA cycle (mode=${mode}).`);

  const context = gatherContext();
  const promptTemplate = loadPrompt()
    .replace(/\{\{CODA_TIMEZONE\}\}/g, get("CODA_TIMEZONE", "Europe/London"))
    .replace(/\{\{CONTEXT\}\}/g, context.text);

  const draft = await generateDraft(promptTemplate, context);

  const outbox = resolvePath(get("OUTBOX_DIR", "./outbox"));
  mkdirSync(outbox, { recursive: true });

  const stamp = ts();
  const mdFile = path.join(outbox, `desk-note-${stamp}.md`);
  const metaFile = path.join(outbox, `desk-note-${stamp}.json`);
  writeFileSync(mdFile, draft.text + "\n", "utf8");

  const meta = {
    createdAt: new Date().toISOString(),
    mode,
    generator: draft.source,
    model: draft.model,
    contextGeneratedAt: context.generatedAt,
    priceRows: context.priceLines.length,
    markdownFile: path.relative(resolvePath("."), mdFile),
  };

  let pr = null;
  if (publish) {
    // Opens a DRAFT PR against a coda/* branch. A human still merges.
    pr = await publishDraft({ markdownPath: mdFile, stamp });
    meta.pullRequest = pr?.html_url ?? null;
  }
  writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n", "utf8");

  log.info(`Draft written: ${meta.markdownFile} (generator=${draft.source}).`);
  if (pr) log.info(`Opened draft PR: ${pr.html_url}`);
  return { mdFile, metaFile, meta, pr };
}

// Allow running directly: node agent/cycle.mjs [--publish]
if (import.meta.url === `file://${process.argv[1]}`) {
  const publish = process.argv.includes("--publish");
  runCycle({ publish }).catch((err) => {
    if (err.code === "MISSING_SECRET" || err.code === "HOST_NOT_ALLOWED") {
      log.error(err.message);
      process.exit(2);
    }
    log.error(err.stack || String(err));
    process.exit(1);
  });
}
