import { readFileSync as read } from "node:fs";
import path from "node:path";
import { get, requireUsable } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import * as gh from "./lib/github.mjs";

// Opens a DRAFT pull request on the site repo containing the generated desk
// note under outbox/. A human always merges. Requires a usable GITHUB_TOKEN.
export async function publishDraft({ markdownPath, stamp }) {
  requireUsable("GITHUB_TOKEN", "fine-grained PAT with contents:write + pull_requests");
  const owner = get("GITHUB_OWNER", "dm1033");
  const repo = get("GITHUB_SITE_REPO", "thecrudeoracle");
  const branch = `coda/desk-note-${stamp}`;
  const fileName = path.basename(markdownPath);
  const targetPath = `outbox/${fileName}`;
  const content = read(markdownPath, "utf8");

  log.info(`Publishing to ${owner}/${repo} on branch ${branch}`);
  const { base, sha } = await gh.getDefaultBranchSha(owner, repo);
  await gh.createBranch(owner, repo, branch, sha);
  await gh.putFile(
    owner,
    repo,
    targetPath,
    Buffer.from(content, "utf8").toString("base64"),
    `CODA desk note ${stamp}`,
    branch,
  );
  const pr = await gh.openPr(
    owner,
    repo,
    branch,
    base,
    `CODA desk note ${stamp}`,
    "Automated desk-note draft from CODA. Review before merge — not financial advice.",
  );
  return pr;
}

// Generic path: open a DRAFT PR that creates or updates a single file in the
// site repo (used by the SIMULATED paper-trade proposal). Human merges.
export async function publishFile({ repoRelPath, content, branch, title, body }) {
  requireUsable("GITHUB_TOKEN", "fine-grained PAT with contents:write + pull_requests");
  const owner = get("GITHUB_OWNER", "dm1033");
  const repo = get("GITHUB_SITE_REPO", "thecrudeoracle");

  log.info(`Publishing ${repoRelPath} to ${owner}/${repo} on branch ${branch}`);
  const { base, sha } = await gh.getDefaultBranchSha(owner, repo);
  await gh.createBranch(owner, repo, branch, sha);
  const existingSha = await gh.getFileSha(owner, repo, repoRelPath, branch);
  await gh.putFile(
    owner,
    repo,
    repoRelPath,
    Buffer.from(content, "utf8").toString("base64"),
    title,
    branch,
    existingSha,
  );
  return gh.openPr(owner, repo, branch, base, title, body);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = process.argv[2];
  if (!p) {
    log.error("usage: node agent/publish.mjs <path-to-markdown>");
    process.exit(64);
  }
  publishDraft({ markdownPath: p, stamp: new Date().toISOString().replace(/[:.]/g, "-") })
    .then((pr) => log.info(`Opened PR: ${pr.html_url}`))
    .catch((err) => {
      if (err.code === "MISSING_SECRET" || err.code === "HOST_NOT_ALLOWED") {
        log.error(err.message);
        process.exit(2);
      }
      log.error(err.stack || String(err));
      process.exit(1);
    });
}
