#!/usr/bin/env bash
# Maestro のフローを iOS シミュレーターで流し、撮った画面のパスを出す
#
#   scripts/maestro.sh <flow> [-e KEY=VALUE ...]   # .maestro/<flow>.yaml
#   MAESTRO_LOCALE=en scripts/maestro.sh english-smoke
#
# シミュレーターは SIMULATOR_NAME で引く（省略時の選び方は _simulator.sh）。出力は
# MAESTRO_OUTPUT_DIR（既定 $TMPDIR/maestro-mahjong-scoring）の <flow>/ に入れ、
# 流すたびに空にする。失敗したときの画面もそこに入る。
#
# 端末の言語は MAESTRO_LOCALE（ja / en。既定 ja）に合わせてから流す。アプリは端末の言語で
# 辞書を選び（英語の端末なら英語の画面）、フローは辞書の文言で要素を待つ・確かめるので、
# 端末の言語がフローの言語と違うと全部のステップが落ちる。シミュレーターの既定の言語は
# 英語なので、何もしなければ日本語の文言で書いた既存のフローがすべて落ちる。
# 既存のフローは日本語のまま使い（英語に写すと日本語の画面の確認を失う）、英語の画面は
# 英語のフロー（english-smoke・store-screenshots）を MAESTRO_LOCALE=en で流して確かめる。
# 端末の AppleLanguages の先頭と AppleLocale を読み、違うときだけ書いて端末を再起動する
# （値は再起動で効く。同じ言語で続けて流すときは再起動しない）。
# launchApp の arguments で -AppleLanguages を渡す方式は採らない。Maestro が iOS でそれを
# アプリの起動引数として渡す確証が無く、システムの確認の画面（リンクを開く確認・パスワードの
# 保存）の言語も端末の設定に従うため。
set -euo pipefail
cd "$(dirname "$0")/.."

FLOW="${1:?flow name (.maestro/<flow>.yaml)}"
shift
if [ ! -f ".maestro/$FLOW.yaml" ]; then
  echo "maestro: .maestro/$FLOW.yaml が無い" >&2
  exit 1
fi

source scripts/_simulator.sh
LOCALE="${MAESTRO_LOCALE:-ja}"
WANT=$(simulator_language_values "$LOCALE") || exit 1
read -r WANT_LANGUAGE WANT_LOCALE <<<"$WANT"

UDID=$(resolve_simulator_udid "${SIMULATOR_NAME:-}")
if [ -z "$UDID" ]; then
  echo "maestro: シミュレーター「${SIMULATOR_NAME:-iPhone <数字> Pro}」が無い" >&2
  exit 1
fi

# 言語の読み書きは起動中の端末にしかできない。起動していなければ起動して待つ
xcrun simctl bootstatus "$UDID" -b >/dev/null
if [ "$(simulator_language "$UDID")" != "$WANT_LANGUAGE" ] ||
  [ "$(simulator_locale "$UDID")" != "$WANT_LOCALE" ]; then
  echo "maestro: 端末の言語を ${LOCALE}（${WANT_LANGUAGE} / ${WANT_LOCALE}）に替えて再起動する"
  set_simulator_language "$UDID" "$LOCALE"
fi
echo "maestro: $(simulator_name "$UDID")（${UDID}）・言語 ${LOCALE}"

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
