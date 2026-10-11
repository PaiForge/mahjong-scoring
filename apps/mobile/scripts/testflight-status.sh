#!/usr/bin/env bash
# scripts/testflight.sh で投入したビルドと、その提出（App Store Connect への送信）の状態を出す
#
#   scripts/testflight-status.sh <ビルド ID>           # 今の状態を 1 行出して終わる
#   scripts/testflight-status.sh <ビルド ID> --watch   # 変わるたびに 1 行出し、終わったら抜ける
#
# 1 行は `build=<状態> submission=<状態> buildNumber=<番号>`。終わりは、提出が
# FINISHED / ERRORED / CANCELED になったときか、ビルドが ERRORED / CANCELED になったとき。
# 提出の FINISHED は App Store Connect が受け取ったところまでで、TestFlight に並ぶのは
# その後の Apple 側の処理（10〜30 分）が済んでから。
set -euo pipefail
cd "$(dirname "$0")/.."

BUILD_ID="${1:?ビルド ID を渡す}"
WATCH=false
[ "${2:-}" = "--watch" ] && WATCH=true

# 提出の一覧はビルドの状態も抱えているので、1 回の呼び出しで両方が取れる
status_line() {
  npx -y eas-cli@latest submit:list --platform ios --limit 10 --json 2>/dev/null |
    jq -r --arg id "$BUILD_ID" '
      [.[] | select(.submittedBuild.id == $id)][0]
      | if . == null then "build=UNKNOWN submission=NOT_FOUND buildNumber=?"
        else "build=\(.submittedBuild.status) submission=\(.status) buildNumber=\(.submittedBuild.appBuildVersion)"
        end' ||
    echo "build=UNKNOWN submission=UNKNOWN buildNumber=?"
}

is_done() {
  case "$1" in
    *submission=FINISHED* | *submission=ERRORED* | *submission=CANCELED*) return 0 ;;
    *build=ERRORED* | *build=CANCELED*) return 0 ;;
  esac
  return 1
}

if [ "$WATCH" = false ]; then
  status_line
  exit 0
fi

prev=""
while true; do
  line=$(status_line)
  if [ "$line" != "$prev" ]; then
    echo "$(date +%T) $line"
    prev=$line
  fi
  is_done "$line" && exit 0
  sleep 30
done
