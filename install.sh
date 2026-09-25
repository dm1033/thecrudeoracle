#!/usr/bin/env bash
# ============================================================================
# CODA — The Crude Oracle Desk Agent · install / bootstrap
# ----------------------------------------------------------------------------
# Idempotent. Safe to re-run. Installs site dependencies, prepares the agent
# working directories, seeds secrets/.env from the template, and generates a
# console token if one is missing. Never prints secret values.
#
#   bash install.sh                 # dependencies + agent scaffold
#   bash install.sh --with-repos    # also clone site + desk repos (needs token)
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

WITH_REPOS=0
for arg in "$@"; do
  case "$arg" in
    --with-repos) WITH_REPOS=1 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "install.sh: unknown option '$arg'" >&2; exit 64 ;;
  esac
done

log() { printf '%s [install] %s\n' "$(date -u +%FT%TZ)" "$*"; }

# --- 1. Site dependencies (Next.js) ----------------------------------------
if [ -f package-lock.json ]; then
  log "Installing site dependencies with npm ci…"
  npm ci
else
  log "No package-lock.json found; running npm install…"
  npm install
fi

# --- 2. Agent working directories ------------------------------------------
log "Ensuring agent directories…"
mkdir -p secrets network prompts outbox repos logs run
chmod 700 secrets 2>/dev/null || true

# --- 3. secrets/.env from template -----------------------------------------
if [ ! -f secrets/.env ]; then
  if [ -f secrets/.env.example ]; then
    cp secrets/.env.example secrets/.env
    chmod 600 secrets/.env
    log "Created secrets/.env from template (mode 0600). Fill in real keys before publishing."
  else
    log "WARNING: secrets/.env.example missing; cannot seed secrets/.env." >&2
  fi
else
  log "secrets/.env already present; leaving it untouched."
fi

# --- 4. Console token ------------------------------------------------------
set_env_kv() {
  # set_env_kv KEY VALUE  — replace or append KEY=VALUE in secrets/.env
  local key="$1" val="$2" file="secrets/.env"
  if grep -qE "^${key}=" "$file" 2>/dev/null; then
    local tmp; tmp="$(mktemp)"
    # Avoid sed delimiter clashes with hex values by rebuilding the file.
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        "${key}="*) printf '%s=%s\n' "$key" "$val" >> "$tmp" ;;
        *) printf '%s\n' "$line" >> "$tmp" ;;
      esac
    done < "$file"
    mv "$tmp" "$file"
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
  chmod 600 "$file"
}

if [ -f secrets/.env ]; then
  current_token="$(grep -E '^AGENT_CONSOLE_TOKEN=' secrets/.env | head -n1 | cut -d= -f2- || true)"
  if [ -z "$current_token" ] || [ "$current_token" = "replace_me" ]; then
    if command -v openssl >/dev/null 2>&1; then
      new_token="$(openssl rand -hex 32)"
    else
      new_token="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
    fi
    set_env_kv AGENT_CONSOLE_TOKEN "$new_token"
    log "Generated a new AGENT_CONSOLE_TOKEN (value not shown)."
  else
    log "AGENT_CONSOLE_TOKEN already set; leaving it untouched."
  fi
fi

# --- 5. Optional repo clones -----------------------------------------------
if [ "$WITH_REPOS" = "1" ]; then
  owner="$(grep -E '^GITHUB_OWNER=' secrets/.env | cut -d= -f2- || echo dm1033)"
  site="$(grep -E '^GITHUB_SITE_REPO=' secrets/.env | cut -d= -f2- || echo thecrudeoracle)"
  desk="$(grep -E '^GITHUB_DESK_REPO=' secrets/.env | cut -d= -f2- || echo thecrudeoracle-desk)"
  token="$(grep -E '^GITHUB_TOKEN=' secrets/.env | cut -d= -f2- || true)"
  if [ -z "$token" ] || [ "$token" = "replace_me" ]; then
    log "--with-repos requested but GITHUB_TOKEN is not set; skipping clones."
  else
    for repo in "$site" "$desk"; do
      dest="repos/$repo"
      if [ -d "$dest/.git" ]; then
        log "repos/$repo already cloned; skipping."
      else
        log "Cloning $owner/$repo …"
        git clone --depth 1 "https://x-access-token:${token}@github.com/${owner}/${repo}.git" "$dest" \
          || log "WARNING: clone of $owner/$repo failed (continuing)."
      fi
    done
  fi
fi

log "Install complete. Start the console with: bash start.sh"
