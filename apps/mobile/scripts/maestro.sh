#!/usr/bin/env bash
# Maestro のフローを iOS シミュレーターで流し、撮った画面のパスを出す
#
#   scripts/maestro.sh <flow> [-e KEY=VALUE ...]   # .maestro/<flow>.yaml
#
# シミュレーターは SIMULATOR_NAME（既定 iPhone 16 Pro）で引く。出力は
# MAESTRO_OUTPUT_DIR（既定 $TMPDIR/maestro-mahjong-scoring）の <flow>/ に入れ、
# 流すたびに空にする。失敗したときの画面もそこに入る。
set -euo pipefail
cd "$(dirname "$0")/.."

FLOW="${1:?flow name (.maestro/<flow>.yaml)}"
shift
if [ ! -f ".maestro/$FLOW.yaml" ]; then
  echo "maestro: .maestro/$FLOW.yaml が無い" >&2
  exit 1
fi

DEVICE_NAME="${SIMULATOR_NAME:-iPhone 16 Pro}"
UDID=$(xcrun simctl list devices available -j |
  jq -r --arg name "$DEVICE_NAME" '.devices[][] | select(.name == $name) | .udid' | head -1)
if [ -z "$UDID" ]; then
  echo "maestro: シミュレーター「$DEVICE_NAME」が無い" >&2
  exit 1
fi

BASE="${MAESTRO_OUTPUT_DIR:-${TMPDIR:-/tmp}/maestro-mahjong-scoring}"
OUT="$(cd "$(dirname "$BASE")" && pwd)/$(basename "$BASE")/$FLOW"
rm -rf "$OUT"
mkdir -p "$OUT"

status=0
maestro --device "$UDID" test \
  --test-output-dir "$OUT" --debug-output "$OUT" --flatten-debug-output \
  "$@" ".maestro/$FLOW.yaml" || status=$?

echo "maestro: 撮った画面:"
find "$OUT" -name '*.png' | sort | sed 's/^/  /'
exit $status
