#!/usr/bin/env bash
# Commit the named paths, if they changed, onto a bot branch and open or update a pull request.
# This repository does not let GitHub Actions open pull requests, so that refusal publishes the
# same refresh to main. Otherwise main is left untouched. Requires GH_TOKEN, COMMIT_MESSAGE,
# PR_TITLE and PR_BODY.
set -euo pipefail

branch="${1:?branch name}"
shift
if [ "$#" -eq 0 ]; then
  echo "open-data-pr.sh: no paths" >&2
  exit 1
fi

if git diff --quiet -- "$@"; then
  echo "No change in: $*"
  exit 0
fi

: "${COMMIT_MESSAGE:?}"
: "${PR_TITLE:?}"
: "${PR_BODY:?}"

publish_to_main() {
  local attempt
  for attempt in 1 2; do
    git fetch origin main
    git checkout -B main origin/main
    git checkout "$branch" -- "$@"
    git add -- "$@"
    if git diff --cached --quiet -- "$@"; then
      echo "main already contains this refresh."
      return 0
    fi
    git commit -m "$COMMIT_MESSAGE"
    if git push origin HEAD:main; then
      echo "Published ${branch} onto main."
      return 0
    fi
    echo "Push to main was rejected (attempt ${attempt})." >&2
  done
  echo "Could not publish ${branch} to main." >&2
  return 1
}

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -B "$branch"
git add -- "$@"
git commit -m "$COMMIT_MESSAGE"

if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
  git fetch origin "$branch"
  git push --force-with-lease -u origin "$branch"
else
  git push -u origin "$branch"
fi

existing="$(gh pr list --head "$branch" --base main --state open --json number --jq '.[0].number')"
if [ -n "$existing" ] && [ "$existing" != "null" ]; then
  echo "Updated pull request #${existing} for ${branch}"
  exit 0
fi

pr_err="$(mktemp)"
if gh pr create --base main --head "$branch" --title "$PR_TITLE" --body "$PR_BODY" 2>"$pr_err"; then
  rm -f "$pr_err"
  exit 0
fi

if grep -q "not permitted to create or approve pull requests" "$pr_err"; then
  cat "$pr_err" >&2
  rm -f "$pr_err"
  echo "GitHub Actions cannot open pull requests in this repository. Publishing the refresh to main."
  publish_to_main "$@"
  exit 0
fi

cat "$pr_err" >&2
rm -f "$pr_err"
exit 1
