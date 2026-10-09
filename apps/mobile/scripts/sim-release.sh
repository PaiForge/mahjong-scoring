#!/usr/bin/env bash
# iOS シミュレーター向けの Release ビルドを、手元の Supabase と web に向けて作る
#
#   scripts/sim-release.sh [シミュレーターの名前]   # 既定は iPhone 16 Pro
#
# web 版や開発ビルドでは見えないネイティブの壊れ方を、本番に触れずに確かめるためのもの。
# ログインから記録までシードユーザー（apps/web の dev seed）で通せる。
set -euo pipefail
cd "$(dirname "$0")/.."

DEVICE_NAME="${1:-iPhone 16 Pro}"
UDID=$(xcrun simctl list devices available -j |
  jq -r --arg name "$DEVICE_NAME" '.devices[][] | select(.name == $name) | .udid' | head -1)
if [ -z "$UDID" ]; then
  echo "sim-release: シミュレーター「$DEVICE_NAME」が無い（xcrun simctl list devices available）" >&2
  exit 1
fi

# Supabase CLI がローカル環境に既定で振る公開キー（src/auth/supabase-config.ts と同じ値）
LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
LOCAL_SUPABASE_PUBLISHABLE_KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
LOCAL_SITE_URL="http://localhost:3000"

# Metro の変換キャッシュは EXPO_PUBLIC_* の値をキーに含めない。前に別の接続先で
# ビルドしていると、その値が焼き込まれたバンドルが「変換済み」として再利用される
TMP="${TMPDIR:-/tmp}"
rm -rf "$TMP/metro-cache"
find "$TMP" -maxdepth 1 -name 'metro-file-map-*' -exec rm -rf {} +

# expo run:ios は package.json の ios / android スクリプトを `expo run:*` に書き換える。
# ビルド前の内容を退避して書き戻す（git checkout だと未コミットの編集まで消える）
PACKAGE_BACKUP=$(mktemp)
cp package.json "$PACKAGE_BACKUP"
trap 'cp "$PACKAGE_BACKUP" package.json; rm -f "$PACKAGE_BACKUP"' EXIT

EXPO_PUBLIC_SUPABASE_URL="$LOCAL_SUPABASE_URL" \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$LOCAL_SUPABASE_PUBLISHABLE_KEY" \
EXPO_PUBLIC_SITE_URL="$LOCAL_SITE_URL" \
CI=1 npx expo run:ios --configuration Release --device "$UDID" --no-bundler

# 焼き込まれた接続先を検査する。本番の URL が残っていたら、このビルドで操作してはいけない
APP=$(xcrun simctl get_app_container "$UDID" help.mahjong.score)
EMBEDDED=$(strings "$APP/main.jsbundle" |
  grep -oE 'https://[a-z0-9]+\.supabase\.co|http://127\.0\.0\.1:54321|http://localhost:3000' | sort -u)
echo "sim-release: バンドルの接続先:"
echo "$EMBEDDED" | sed 's/^/  /'
if echo "$EMBEDDED" | grep -q 'supabase\.co'; then
  echo "sim-release: 本番の接続先が焼き込まれている。Metro のキャッシュが残っている" >&2
  exit 1
fi
if ! echo "$EMBEDDED" | grep -qF "$LOCAL_SUPABASE_URL"; then
  echo "sim-release: 手元の Supabase の URL がバンドルに無い" >&2
  exit 1
fi
echo "sim-release: $DEVICE_NAME ($UDID) に入れた"
