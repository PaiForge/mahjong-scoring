# sim-release.sh と maestro.sh が共有する、iOS シミュレーターの選び方（source して使う）
#
# 名前を渡せばその端末。渡さなければ:
#   1. 起動中の iPhone（sim-release.sh で入れた端末を maestro.sh がそのまま引く）
#   2. 無ければ、いちばん新しい iOS の実行環境の「iPhone <数字> Pro」
#
# 既定の名前を決め打ちにしない。端末の名前は Xcode の版で入れ替わり（Xcode 27 に
# iPhone 16 Pro は無い）、決め打ちだと Xcode を上げるたびに両方のスクリプトが止まる。

# 引数: 端末の名前（空なら上の規則で選ぶ）。標準出力に UDID、見つからなければ空
resolve_simulator_udid() {
  local name="${1:-}"
  local devices
  devices=$(xcrun simctl list devices available -j)
  if [ -n "$name" ]; then
    echo "$devices" | jq -r --arg name "$name" \
      '.devices[][] | select(.name == $name) | .udid' | head -1
    return
  fi
  local booted
  booted=$(echo "$devices" | jq -r \
    '.devices[][] | select(.state == "Booted" and (.name | startswith("iPhone"))) | .udid' | head -1)
  if [ -n "$booted" ]; then
    echo "$booted"
    return
  fi
  # 実行環境のキー（com.apple.CoreSimulator.SimRuntime.iOS-27-1）を版の数字で並べ、新しい順に探す
  echo "$devices" | jq -r '
    .devices
    | to_entries
    | map(select(.key | test("SimRuntime\\.iOS-")))
    | sort_by(.key | capture("iOS-(?<v>[0-9-]+)$").v | split("-") | map(tonumber))
    | reverse
    | map(.value[] | select(.name | test("^iPhone [0-9]+ Pro$")))
    | .[0].udid // empty'
}

# UDID の端末の名前（メッセージ用）
simulator_name() {
  xcrun simctl list devices -j |
    jq -r --arg udid "$1" '.devices[][] | select(.udid == $udid) | .name' | head -1
}

# 端末の言語（maestro.sh が MAESTRO_LOCALE に合わせる）
#
# アプリは端末の言語（iOS の優先する言語の先頭）で辞書を選ぶので、Maestro の文言の確認は
# 端末の言語に依る。言語はグローバルドメイン（defaults の -g。ファイルは
# .GlobalPreferences.plist）の AppleLanguages（優先する言語の並び）と AppleLocale（地域の
# 書式）で、書いた値は端末を再起動するまで効かない。読み書きは起動中の端末にしかできない
# （simctl spawn は起動中の端末の中でコマンドを走らせる）。
#
# ドメインは必ず -g で指す。以前は ".GlobalDomain" と書いていたが、これは defaults の
# 既知の名前（-g / -globalDomain / NSGlobalDomain）ではなく、".GlobalDomain.plist" という
# 別のドメインを作って書くだけで、iOS は読まない。読み戻しも同じ偽のドメインを読んでいたので
# 「書いた値と同じだから再起動しない」の判定が通り、切替が効いていないことに気付けなかった
# （英語の確認が通っていたのは、端末の実際の言語が元々英語だったため）。シミュレーターに
# 残った .GlobalDomain.plist は誰も読まないので放置してよい。

# 引数: アプリの言語（ja / en）。標準出力に「AppleLanguages の先頭 AppleLocale」、知らない言語なら失敗
#
# en は地域付きの en-US / en_US にする。iOS が英語の端末に既定で入れる値がこれで、
# 日付・数の書式の地域もそれに揃う
simulator_language_values() {
  case "$1" in
    ja) echo "ja ja_JP" ;;
    en) echo "en-US en_US" ;;
    *)
      echo "simulator: 言語「$1」は扱わない（ja / en）" >&2
      return 1
      ;;
  esac
}

# 引数: UDID（起動中）。標準出力に AppleLanguages の先頭（例: ja / en-US）、未設定なら空
#
# defaults read -g AppleLanguages は配列を古い plist の書式で出す。改行の入り方は
# 出力先で変わり（パイプでは「(」「    "en-JP",」「    "ja-JP"」「)」の複数行、
# `(ja)`・`("en-JP","ja-JP")` の 1 行で見えることもある）、引用符は - を含む値にだけ付く。
# 行の位置に頼らず（以前の「2 行目を取る」は複数行の形にしか効かない）、空白・丸括弧・
# 引用符を落としてカンマで切った最初の要素を取る。言語タグは空白もカンマも含まない
simulator_language() {
  { xcrun simctl spawn "$1" defaults read -g AppleLanguages 2>/dev/null || true; } |
    tr -d '[:space:]()"' | cut -d, -f1
}

# 引数: UDID（起動中）。標準出力に AppleLocale（例: ja_JP / en_US）、未設定なら空
simulator_locale() {
  xcrun simctl spawn "$1" defaults read -g AppleLocale 2>/dev/null || true
}

# 引数: UDID（起動中）・アプリの言語（ja / en）。端末の言語を書き、再起動して起動完了まで待つ
#
# 再起動するのは、AppleLanguages / AppleLocale が起動時にしか読まれないため（書いただけでは
# アプリにもシステムの確認の画面にも効かない）。入れてあるアプリとその保存した状態は残る
set_simulator_language() {
  local udid="$1" values lang locale
  values=$(simulator_language_values "$2") || return 1
  read -r lang locale <<<"$values"
  xcrun simctl spawn "$udid" defaults write -g AppleLanguages -array "$lang"
  xcrun simctl spawn "$udid" defaults write -g AppleLocale -string "$locale"
  xcrun simctl shutdown "$udid"
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null
}
