import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = path.resolve(__dirname, "../../scripts/open-data-pr.sh");
const roots: string[] = [];

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function setupRepo(): { work: string; origin: string; bin: string } {
  const root = mkdtempSync(path.join(tmpdir(), "open-data-pr-"));
  roots.push(root);
  const origin = path.join(root, "origin.git");
  const work = path.join(root, "work");
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  execFileSync("git", ["init", "--bare", "-b", "main", origin], { stdio: "pipe" });
  execFileSync("git", ["init", "-b", "main", work], { stdio: "pipe" });
  git(work, ["config", "user.email", "actions@example.com"]);
  git(work, ["config", "user.name", "actions"]);
  writeFileSync(path.join(work, "prices.json"), '{"brent":70}\n');
  git(work, ["add", "prices.json"]);
  git(work, ["commit", "-m", "initial"]);
  git(work, ["remote", "add", "origin", origin]);
  git(work, ["push", "-u", "origin", "HEAD:main"]);
  return { work, origin, bin };
}

function fakeGh(bin: string, body: string) {
  const file = path.join(bin, "gh");
  writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

function run(work: string, bin: string) {
  writeFileSync(path.join(work, "prices.json"), '{"brent":81}\n');
  return execFileSync("bash", [SCRIPT, "bot/prices", "prices.json"], {
    cwd: work,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GH_TOKEN: "test-token",
      COMMIT_MESSAGE: "chore: refresh prices",
      PR_TITLE: "chore: refresh prices",
      PR_BODY: "Automated refresh.",
    },
    encoding: "utf8",
  });
}

function mainFile(origin: string): string {
  return execFileSync("git", ["--git-dir", origin, "show", "main:prices.json"], { encoding: "utf8" });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("open-data-pr.sh", () => {
  it("publishes the refresh to main when Actions cannot open a pull request", () => {
    const { work, origin, bin } = setupRepo();
    fakeGh(
      bin,
      `if [ "$1" = "pr" ] && [ "$2" = "list" ]; then exit 0; fi
if [ "$1" = "pr" ] && [ "$2" = "create" ]; then
  echo "pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)" >&2
  exit 1
fi
echo "unexpected gh $*" >&2
exit 1`
    );
    const output = run(work, bin);
    expect(output).toContain("Publishing the refresh to main.");
    expect(output).toContain("Published bot/prices onto main.");
    expect(mainFile(origin)).toBe('{"brent":81}\n');
  });

  it("leaves main untouched when the pull request opens", () => {
    const { work, origin, bin } = setupRepo();
    fakeGh(
      bin,
      `if [ "$1" = "pr" ] && [ "$2" = "list" ]; then exit 0; fi
if [ "$1" = "pr" ] && [ "$2" = "create" ]; then echo "https://example.test/pull/1"; exit 0; fi
echo "unexpected gh $*" >&2
exit 1`
    );
    const output = run(work, bin);
    expect(output).not.toContain("Publishing the refresh to main.");
    expect(mainFile(origin)).toBe('{"brent":70}\n');
    expect(execFileSync("git", ["--git-dir", origin, "show", "bot/prices:prices.json"], { encoding: "utf8" })).toBe(
      '{"brent":81}\n'
    );
  });

  it("fails on any other pull request error and does not publish to main", () => {
    const { work, origin, bin } = setupRepo();
    fakeGh(
      bin,
      `if [ "$1" = "pr" ] && [ "$2" = "list" ]; then exit 0; fi
echo "pull request create failed: GraphQL: something else" >&2
exit 1`
    );
    let failed = false;
    try {
      run(work, bin);
    } catch (error) {
      failed = true;
      const stderr = String((error as { stderr?: string }).stderr ?? "");
      expect(stderr).toContain("something else");
      expect(stderr).not.toContain("Publishing the refresh to main.");
    }
    expect(failed).toBe(true);
    expect(mainFile(origin)).toBe('{"brent":70}\n');
  });

  it("does nothing when the named file is unchanged", () => {
    const { work, bin } = setupRepo();
    fakeGh(bin, `echo "gh should not run" >&2\nexit 1`);
    const output = execFileSync("bash", [SCRIPT, "bot/prices", "prices.json"], {
      cwd: work,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        GH_TOKEN: "test-token",
        COMMIT_MESSAGE: "chore: refresh prices",
        PR_TITLE: "chore: refresh prices",
        PR_BODY: "Automated refresh.",
      },
      encoding: "utf8",
    });
    expect(output).toContain("No change in: prices.json");
    expect(readFileSync(path.join(work, "prices.json"), "utf8")).toBe('{"brent":70}\n');
  });
});
