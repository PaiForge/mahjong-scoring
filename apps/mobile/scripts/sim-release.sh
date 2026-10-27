#!/usr/bin/env bash
# iOS シミュレーター向けの Release ビルドを、手元の Supabase と web に向けて作る
#
#   scripts/sim-release.sh [シミュレーターの名前]   # 省略時の選び方は _simulator.sh
#   DEVELOPER_DIR=/Applications/Xcode-<版>.app/Contents/Developer scripts/sim-release.sh
#
# 使う Xcode は DEVELOPER_DIR で選べる（省略時は xcode-select の Xcode）。古い版で確かめたい
# ときだけ渡す
#
# web 版や開発ビルドでは見えないネイティブの壊れ方を、本番に触れずに確かめるためのもの。
# ログインから記録までシードユーザー（apps/web の dev seed）で通せる。
set -euo pipefail
cd "$(dirname "$0")/.."

source scripts/_simulator.sh
UDID=$(resolve_simulator_udid "${1:-}")
if [ -z "$UDID" ]; then
  echo "sim-release: シミュレーター「${1:-iPhone <数字> Pro}」が無い（xcrun simctl list devices available）" >&2
  exit 1
fi
DEVICE_NAME=$(simulator_name "$UDID")

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

# バンドルの組み立て（Xcode のビルドの中の Metro）がこの値を読む
export EXPO_PUBLIC_SUPABASE_URL="$LOCAL_SUPABASE_URL"
export EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$LOCAL_SUPABASE_PUBLISHABLE_KEY"
export EXPO_PUBLIC_SITE_URL="$LOCAL_SITE_URL"
export CI=1

# アプリは「Apple でログイン」の entitlement を持ち、expo run:ios はそれを持つアプリを
# シミュレーター向けでも署名する（@expo/cli の simulatorBuildRequiresCodeSigning）。
# Apple Development の証明書が無い Mac ではそこで止まるので、ad hoc 署名（証明書の要らない
# 「-」。Xcode の Sign to Run Locally と同じ）で xcodebuild で組み、simctl で入れる。署名を
# 丸ごと外す（CODE_SIGNING_ALLOWED=NO）と entitlement が付かず、キーチェーンが使えなくなって
# expo-secure-store がログインの保存に失敗する（KeyChainException: A required entitlement is
# not present）。この経路のビルドでは「Apple でログイン」だけが通らない
if security find-identity -v -p codesigning | grep -q "Apple Development"; then
  npx expo run:ios --configuration Release --device "$UDID" --no-bundler
else
  echo "sim-release: Apple Development の証明書が無いので、ad hoc 署名でビルドする（Apple でログインは通らない）"
  # ios/ の生成と pod install（expo run:ios が先に行うのと同じ）
  npx expo prebuild --platform ios
  xcrun simctl boot "$UDID" 2>/dev/null || true
  # 中間生成物は Xcode の版ごとに分ける（版の違うモジュールのキャッシュを混ぜない）。
  # 行き先は特定の端末でなく汎用のシミュレーターにする。古い Xcode（DEVELOPER_DIR で
  # 選んだとき）は、自分より新しい iOS の端末を行き先に取れない
  # head は読み残しで xcodebuild を SIGPIPE で落とし、pipefail でスクリプトごと止まるので sed で取る
  DERIVED="ios/build-unsigned-$(xcodebuild -version | sed -n 1p | tr -c 'A-Za-z0-9.\n' '-')"
  xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release \
    -sdk iphonesimulator -destination "generic/platform=iOS Simulator" -derivedDataPath "$DERIVED" \
    CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER= \
    -quiet build
  BUILT_APP=$(find "$DERIVED/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' | head -1)
  [ -n "$BUILT_APP" ] || { echo "sim-release: ビルドした .app が見つからない" >&2; exit 1; }
  xcrun simctl install "$UDID" "$BUILT_APP"
  xcrun simctl launch "$UDID" help.mahjong.score >/dev/null
fi

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
