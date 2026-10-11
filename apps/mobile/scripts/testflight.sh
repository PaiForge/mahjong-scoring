#!/usr/bin/env bash
# main の HEAD を EAS で iOS の production ビルドにし、済んだら TestFlight（App Store Connect）へ送る
#
#   scripts/testflight.sh [--any-branch]
#
# 投入するだけで待たない。最後の行にビルド ID を出すので、状態は
# scripts/testflight-status.sh <ビルド ID> [--watch] で見る。
# 証明書・プロファイル・App Store Connect の API キーは EAS のサーバー側にあり、
# 手元に Apple のログインは要らない。
set -euo pipefail
cd "$(dirname "$0")/.."

EAS=(npx -y eas-cli@latest)
ANY_BRANCH=false
[ "${1:-}" = "--any-branch" ] && ANY_BRANCH=true

fail() {
  echo "testflight: $*" >&2
  exit 1
}

# EAS は git のコミットを固めて送る。ストアに出すビルドは main のプッシュ済みのコミットから作り、
# ビルドの画面に出るコミットが GitHub で辿れる状態にする
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$ANY_BRANCH" = false ]; then
  fail "main 以外（${BRANCH}）から出そうとしている。意図したものなら --any-branch"
fi
git diff --quiet HEAD -- . ../../packages ../../pnpm-lock.yaml ||
  fail "未コミットの変更がある（ビルドの中身が記録されるコミットと食い違う）"
git fetch --quiet origin "$BRANCH" 2>/dev/null || true
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH" 2>/dev/null || true)" ]; then
  fail "HEAD が origin/$BRANCH と一致しない（プッシュ前か、取り込み忘れ）"
fi

# app.json の読み込みとフィンガープリントの計算は手元の expo を使う
[ -d node_modules/expo ] || fail "依存が無い。リポジトリのルートで pnpm install --frozen-lockfile"

"${EAS[@]}" whoami >/dev/null 2>&1 || fail "EAS にログインしていない（npx eas-cli login）"

# 本番の接続先が無いビルドはログインを出さないまま通ってしまう（README の「本番の接続先」）
ENV_NAMES=$("${EAS[@]}" env:list --environment production 2>/dev/null)
for name in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; do
  echo "$ENV_NAMES" | grep -q "^$name=" || fail "EAS の production 環境に $name が無い"
done

LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT
"${EAS[@]}" build --platform ios --profile production --auto-submit \
  --non-interactive --no-wait 2>&1 | tee "$LOG"

BUILD_ID=$(grep -oE '/builds/[0-9a-f-]{36}' "$LOG" | head -1 | cut -d/ -f3)
[ -n "$BUILD_ID" ] || fail "ビルド ID を出力から読めなかった（上のログを見る）"
grep -q 'Scheduled iOS submission' "$LOG" || fail "提出の予約が出力に無い（ビルド ${BUILD_ID}）"
echo "testflight: build $BUILD_ID"
