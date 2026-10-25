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
