# Repository-specific values for scripts/claude-cloud/*.
#
# This is the only file in the directory that is edited per repository. The
# other scripts are generic copies from the dotagents skill
# `claude-cloud-session-bootstrap`; refresh them with `bootstrap.py --update`
# instead of editing them here, so every repository keeps the same fixes.
#
# Sourced by bash (session-start.sh, stack-up.sh, screenshot.sh); screenshot.sh
# exports the LOGIN_* / CONSENT_* / LOCALE / SEED_* values for screenshot.mjs.

# Shown in the SessionStart summary handed to Claude.
CLOUD_PROJECT_NAME="mahjong-scoring"

# Directory of the Next.js app that owns supabase/config.toml and .env.example,
# relative to the repository root, and the `pnpm --filter` selector for it.
APP_DIR="apps/web"
PKG_FILTER="web"

APP_URL="http://localhost:3000"
# Path that must answer 200 once `next dev` is up (also the screenshot.sh
# readiness probe).
HEALTH_PATH="/"

# What Claude is told to run before finishing. The same commands are
# pre-approved in .claude/settings.json so a session driven from a phone does
# not stall on permission prompts.
QUALITY_GATES="pnpm lint && pnpm typecheck && pnpm test"

# Supabase services excluded from `supabase start`. Keep edge-runtime here
# unless the app has Edge Functions: the cloud VM cannot raise rlimits, and the
# CLI starts that one container with `--ulimit nofile=65536:65536`, which runc
# rejects ("error setting rlimit type 7") and takes the whole start down with
# it. The rest are dashboards and log plumbing the app never calls.
SUPABASE_EXCLUDE="edge-runtime,studio,logflare,vector,imgproxy,postgres-meta"

# package.json scripts of $APP_DIR, run in order once Supabase is up
# (migrate, then seeds). Each runs as `pnpm --filter $PKG_FILTER <script>`.
DB_STEPS=("db:run-migrate" "db:seed:dev")

# .env.local keys filled from `supabase status -o json`, as ENV_KEY=STATUS_FIELD.
# Status fields: API_URL, ANON_KEY, SERVICE_ROLE_KEY (legacy JWT keys),
# PUBLISHABLE_KEY, SECRET_KEY (new-style keys), DB_URL, ...
ENV_MAP=("NEXT_PUBLIC_SUPABASE_URL=API_URL" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PUBLISHABLE_KEY" "SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY")

# dev-seed accounts, for `screenshot.sh --login <user>` and the summary.
SEED_EMAIL_DOMAIN="example.local"
SEED_PASSWORD="devpass1"
SEED_USERS="alice bob carol admin"

# Sign-in form, for screenshot.mjs. After submitting, the URL must stop
# containing LOGIN_DONE_EXCLUDES for the sign-in to count as finished.
LOGIN_PATH="/sign-in"
LOGIN_EMAIL_SELECTOR="#signin-email"
LOGIN_PASSWORD_SELECTOR="#signin-password"
LOGIN_SUBMIT_SELECTOR='form button[type="submit"]'
LOGIN_DONE_EXCLUDES="/sign-in"

# Cookie that records a consent-banner decision so the banner does not cover
# the bottom of every screenshot. Leave the name empty when there is no banner.
CONSENT_COOKIE_NAME=""
CONSENT_COOKIE_VALUE=""
LOCALE="ja-JP"

# Optional hooks for steps the generic scripts do not know about. Define the
# function here and the scripts call it when it exists:
#
#   cloud_after_install   session-start.sh, after dependencies are installed
#                         (e.g. copy engine assets into public/)
#   cloud_extra_summary   session-start.sh, extra lines for the summary
#   cloud_before_db       stack-up.sh, after Supabase is up and .env.local is
#                         written, before DB_STEPS
