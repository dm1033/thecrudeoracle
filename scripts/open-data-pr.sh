#!/usr/bin/env bash
# Commit the named paths, if they changed, onto a bot branch and open or update a pull request.
# Direct pushes to main are not used. Requires GH_TOKEN, COMMIT_MESSAGE, PR_TITLE and PR_BODY.
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

gh pr create --base main --head "$branch" --title "$PR_TITLE" --body "$PR_BODY"
