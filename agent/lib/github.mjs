import { get, requireUsable } from "./env.mjs";
import { guardedFetch } from "./allowlist.mjs";

const API = "https://api.github.com";

function headers() {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${requireUsable("GITHUB_TOKEN", "fine-grained PAT with contents:write + pull_requests")}`,
    "x-github-api-version": "2022-11-28",
    "user-agent": "coda-desk-agent",
  };
}

async function gh(pathname, opts = {}) {
  const res = await guardedFetch(`${API}${pathname}`, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`GitHub ${opts.method || "GET"} ${pathname} failed: ${res.status} ${json.message || res.statusText}`);
  }
  return json;
}

export async function getDefaultBranchSha(owner, repo) {
  const repoInfo = await gh(`/repos/${owner}/${repo}`);
  const base = repoInfo.default_branch;
  const ref = await gh(`/repos/${owner}/${repo}/git/ref/heads/${base}`);
  return { base, sha: ref.object.sha };
}

export async function createBranch(owner, repo, branch, sha) {
  return gh(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}

export async function putFile(owner, repo, filePath, contentB64, message, branch) {
  return gh(`/repos/${owner}/${repo}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: contentB64, branch }),
  });
}

export async function openPr(owner, repo, head, base, title, bodyText) {
  return gh(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head, base, body: bodyText, draft: true }),
  });
}

export { get };
