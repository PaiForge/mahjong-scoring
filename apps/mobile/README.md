# @mahjong-scoring/mobile

web と同じ画面をネイティブで出す Expo アプリ（iOS / Android）。ログインは web と同じ
Supabase Auth で、記録の読み書きは web のアプリ向け API（`/api/mobile/v1/*`）を通す。

## 開発環境

### 前提

- web の開発環境が動いていること（[apps/web/README.md](../web/README.md) のクイックスタート）。
  アプリは開発中、Metro を動かしている Mac の Supabase（`:54321`）と web（`:3000`）に繋ぐ
- 実機で開くなら、iPhone と Mac が同じ Wi-Fi にいること
- ローカルの Supabase のポート（`:54321` / `:54322`）を他のプロジェクトの Supabase が使って
  いないこと。同じポートを使うプロジェクトが動いていると、接続先は localhost のままその DB に
  繋がり、マイグレーションやシードが別のプロジェクトの DB に向かう。`docker ps --format '{{.Names}}' |
grep supabase_db` が `supabase_db_mahjong-scoring-web` であることを確かめ、違えば
  `pnpm supabase stop --project-id <そのプロジェクト>` で止めてから `pnpm supabase start`（`apps/web` で）

### 起動

```bash
# Mac の側（別々のターミナルで）
pnpm supabase start            # apps/web で
pnpm --filter web dev          # web（アプリ向け API）
pnpm --filter @mahjong-scoring/mobile start
```

開発中は環境変数を設定しなくてよい。接続先は Metro のホストのアドレスから決まる
（`src/auth/supabase-config.ts` と `src/lib/site-url.ts`）。実機からは `localhost` が
端末自身を指すため、Mac の LAN のアドレスに置き換わる。

| 開き方                                                            | できること                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @mahjong-scoring/mobile web`（ブラウザ）           | 画面の確認、メールでのログイン。Apple のボタンは出ない                                                               |
| Expo Go                                                           | 画面の確認、メールでのログイン。Apple のログインは通らない（Expo Go の Bundle ID で署名されるため、Supabase が拒む） |
| 開発ビルド（`npx expo run:ios --device`。下の「実機で確かめる」） | Apple のログインを含めて全部                                                                                         |

開発用のアカウントは web と同じ（`pnpm --filter web db:seed:dev` の `alice@example.local` /
`devpass1` など）。

端末なしでバンドルだけ確かめるときは `CI=1 npx expo start --port 8099` を起動し、
`http://127.0.0.1:8099/apps/mobile/index.bundle?platform=ios&dev=true&lazy=false&transform.routerRoot=src%2Fapp`
（ネイティブは `&transform.engine=hermes` も付ける）で取る。`transform.routerRoot` を付けないと
expo-router が `apps/mobile/app` を探し、アプリのコードが 1 行も入っていないバンドルが 200 で返る。
正しい URL は `curl -H "expo-platform: ios" -H "accept: application/expo+json" localhost:8099/` で
得られるマニフェストの `launchAsset.url` から引ける。

### iOS シミュレーターと Maestro を入れる

アプリの見た目と動きは iOS シミュレーターの Release ビルド（`pnpm --filter @mahjong-scoring/mobile sim:release`）
で確かめ、操作と撮影は Maestro（`.maestro/` のフロー）で流す（[CLAUDE.md](./CLAUDE.md)「確かめ方」）。
どちらも Mac に一度入れれば済むが、Xcode を入れただけでは使えない。

なぜ要るか:

- **ブラウザ版では見つからない不具合がある。** react-native-web は画面の構成を見るためのもので、
  ネイティブでだけ壊れるもの（`crypto.randomUUID` の不在・`measureLayout` の引数・`Modal` の表示の失敗）を
  通してしまう。シミュレーターなら実機と同じ JS エンジン（Hermes）とネイティブの部品で動く
- **TestFlight のビルドは月に限りがある。** EAS の無料プランは iOS のビルドが月 15 回まで（毎月 1 日
  （UTC）に戻る。残りは `npx eas-cli account:usage`）。手元で確かめてから出せば、直しのためのビルドを
  使わずに済む
- **Maestro は確かめ方を残せる。** ログインして記録まで走らせる手順を YAML で流し、各画面を撮る。
  手で同じ操作をやり直さずに済み、Claude Code もこれで画面を撮って確かめる

手順（Xcode は App Store から入れておく。`sudo` の付くものは管理者のパスワードを聞かれる）:

```bash
# 1. コマンドラインのツールを Xcode に向ける（Command Line Tools だけを向いていると simctl が無い）
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
# 2. ライセンスに同意し、初回の部品を入れる
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
# 3. iOS のシミュレーターの実行環境を入れる（数 GB。時間がかかる）
xcodebuild -downloadPlatform iOS
# 4. ネイティブのビルドに使う CocoaPods
brew install cocoapods
# 5. Maestro は Java 17 以上で動く
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
# 6. Maestro
brew tap mobile-dev-inc/tap
brew trust --formula mobile-dev-inc/tap/maestro
brew install mobile-dev-inc/tap/maestro
```

入ったかの確かめ方:

```bash
xcrun simctl list runtimes   # iOS の行がある
java -version                # 17 以上
maestro --version
security find-identity -v -p codesigning   # Apple Development の行（無くても sim:release は動く）
```

最後の 1 つは無くてもよい。証明書があれば `sim:release` は `expo run:ios` で署名してビルドし、
無ければ ad hoc 署名（証明書の要らない「-」。Xcode の Sign to Run Locally と同じ）で
`xcodebuild` で組んで `simctl` で入れる（`scripts/sim-release.sh`）。分けているのは、アプリが
「Apple でログイン」の entitlement を持ち、Expo の CLI はそれを持つアプリをシミュレーター向けでも
署名しようとして、証明書の無い Mac では止まるため（`@expo/cli` の `simulatorBuildRequiresCodeSigning`）。
署名を丸ごと外す（`CODE_SIGNING_ALLOWED=NO`）とキーチェーンが使えず、ログインの保存で落ちる
（`KeyChainException: A required entitlement is not present`）。ad hoc 署名のビルドでは
「Apple でログイン」だけが通らない（メールのログインと記録は通る）。証明書は Xcode > Settings >
Accounts でチームの Apple アカウントを足し、Manage Certificates の「+」から **Apple Development** を作る。

#### Xcode 26.6 で組む（EAS と同じ）

**Xcode 27 で作ったビルドは iOS 27 で起動しない（2026-10 時点）。** iOS 27 の SDK は UIScene の
ライフサイクルを必須にし、Expo SDK 57 の既定（AppDelegate が窓を持つ形）のアプリは起動直後に
`UIScene life cycle is required for apps built with this SDK` で落ちる。EAS は SDK 57 を
Xcode 26.6 でビルドするので、TestFlight やストアのビルドは影響を受けない。手元でも同じ
Xcode 26.6 を並べて入れて組む（UIScene へ移るのは SDK 58 に上げるとき。SDK 58 からは既定。
[Expo の案内](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md)）。

```bash
brew install xcodes aria2
# Apple ID・2 ファクタ認証・管理者のパスワードを聞かれる。対話するのでターミナルで直接打つ
xcodes install 26.6 --directory /Applications --experimental-unxip
# Xcode 26.6 の iOS 26.5 の実行環境（これが無いとシミュレーター向けにも組めない）
DEVELOPER_DIR=/Applications/Xcode-26.6.0.app/Contents/Developer xcodebuild -downloadPlatform iOS
```

ビルドは `DEVELOPER_DIR` で Xcode 26.6 を渡す（`xcode-select` は切り替えなくてよい）。26.5 の SDK で
組んだアプリは iOS 27 の端末でも動き、iOS 27 に上げた iPhone で TestFlight 版を開くのと同じ条件になる:

```bash
DEVELOPER_DIR=/Applications/Xcode-26.6.0.app/Contents/Developer pnpm --filter @mahjong-scoring/mobile sim:release
pnpm --filter @mahjong-scoring/mobile maestro preferences-anchor
```

iOS 27 のシミュレーターは、リンクでアプリを開く前の確認（「"麻雀点数計算教室" で開く?」）と、
ログインの後のパスワードの保存の確認を出す。フローは `_open-link.yaml` と `_sign-in.yaml` が
出たときだけ閉じる。フローでリンクを開くときは `openLink` を直接書かず `_open-link.yaml` を使う。

シミュレーターの画面を窓で見る Simulator.app は無くてもよい。`sim:release` と Maestro は
画面を出さずに端末を起動して操作し、撮った PNG で確かめる（2026-10 に Xcode 27.1 で、
Simulator.app の無いまま起動・撮影できることを確かめた）。

`sim:release` と `maestro` は、端末の名前を渡さなければ起動中の iPhone を、無ければ
いちばん新しい iOS の「iPhone <数字> Pro」を使う（`scripts/_simulator.sh`）。決め打ちの
名前を持たないのは、Xcode の版で端末の名前が入れ替わるため。別の端末を使うなら
`sim:release "iPhone 17"` / `SIMULATOR_NAME="iPhone 17" pnpm --filter @mahjong-scoring/mobile maestro <flow>` で渡す。

EAS の枠を使い切った月に TestFlight へ出すなら、手元でビルドする（`npx eas-cli build --platform ios
--profile production --local`）。上の手順に加えて fastlane（`brew install fastlane`）が要る。

アプリ向け API（`/api/mobile/v1`）を curl で叩くときは、画面の確認を先に済ませる。退会のように
回数制限の厳しい API（`rate-limit-ip.ts`）を同じ IP から何度か叩くと 429 になり、その後 5 分は
ブラウザやアプリからの確認も巻き込まれる（curl だけなら `X-Forwarded-For` を変えれば枠を避けられる）。

## ビルドの環境変数（EAS）

ストアや TestFlight に出すビルドは、本番の接続先を EAS の環境変数で渡す。アプリに
本番の接続先の既定値は無く、無いビルドはログインを出さない（ゲストとして全機能は動く）。

| 変数名                                 | 値                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | 本番の Supabase の URL（`https://<ref>.supabase.co`。Supabase の Project Settings > API） |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 本番の Supabase の公開キー（`sb_publishable_…`。同じ画面）                                |
| `EXPO_PUBLIC_SITE_URL`                 | web の URL。省略すると本番（`https://score.mahjong.help`）                                |

`EXPO_PUBLIC_` の値はアプリの中に埋め込まれる。公開キー以外の秘密を入れないこと。

EAS の `production` 環境に入れる（`eas.json` の `production` プロファイルがこの環境を読む）:

```bash
cd apps/mobile
npx eas-cli env:set --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co
npx eas-cli env:set --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_…
```

## TestFlight に出す

EAS のプロジェクトは `@k0kishima/mahjong-scoring`（`app.json` の `extra.eas.projectId`）。
ビルド番号は EAS 側で持ち、ビルドのたびに 1 つ上がる（`appVersionSource: remote` + `autoIncrement`）。
暗号化は HTTPS だけなので `usesNonExemptEncryption: false` を申告済みで、App Store Connect で
輸出コンプライアンスを毎回答えなくてよい。

```bash
pnpm --filter @mahjong-scoring/mobile testflight                     # 検査してから投入し、ビルド ID を出す
pnpm --filter @mahjong-scoring/mobile testflight:status <ID> --watch # ビルドと提出が終わるまで見る
```

`testflight` は main のプッシュ済みのコミットか・依存・EAS のログイン・`production` 環境の接続先を
確かめてから、`eas build --platform ios --profile production --auto-submit` を待たずに投入する。
Claude Code ではスキル `ship-to-testflight`（`.claude/skills/ship-to-testflight/`）が投入から報告までを通す。

- 初回は Apple ID でのログインを求められる。配布用の証明書とプロビジョニングプロファイルは
  EAS に作らせて EAS 側に置く（「Generate a new Apple Distribution Certificate?」等にすべて Yes）
- `--auto-submit` はビルドが済むと App Store Connect へ送る。アプリの登録が無ければ初回に作られる
- App Store Connect で処理が済むと（10〜30 分）、TestFlight の「内部テスト」のグループに
  自分を入れれば iPhone の TestFlight アプリから入れられる。内部テストに審査は無い
- 本番の Supabase・web に繋がるので、試して作ったアカウントは本番の DB に残る。最後にアプリから
  退会すると、退会と Apple 連携の取り消しの確認を兼ねられる
- EAS のビルドログは brotli 圧縮で、ダウンロードしたものは node の `zlib.brotliDecompressSync` で読める

## Apple でログイン（iOS）

iOS アプリのネイティブの Apple ログインだけを持つ（web の Apple ログインは無い）。
App Store は Google などのログインを出すアプリに Apple のログインも求め
（ガイドライン 4.8）、アプリ内での退会では Apple 側の連携も取り消すことを求める
（[TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)）。

仕組み:

1. アプリが Apple のシートでログインし、ID トークンを Supabase に渡す（`signInWithIdToken`）
2. アプリが Apple の認可コードを web の `/api/mobile/v1/apple/token` に送る。サーバーが
   Apple と交換した refresh token を暗号化して保存する（`apple_refresh_tokens`）
3. 退会の最後の工程で、サーバーがそのトークンを Apple に取り消させる

### Apple Developer の設定（済み）

チームは Fuji LLC（Team ID `YV82X4FFX3`）。作り直すときの参考に残す。

| もの                    | 値                                                | 作り方                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App ID                  | `help.mahjong.score`（Sign in with Apple を有効） | App Store Connect API（`bundleIds` と `bundleIdCapabilities` の `APPLE_ID_AUTH`）か、[Identifiers](https://developer.apple.com/account/resources/identifiers/list) の「＋」→ App IDs       |
| Sign in with Apple の鍵 | Key ID `Z93WHKSUHN`（`.p8` は 1Password）         | [Keys](https://developer.apple.com/account/resources/authkeys/list) の「＋」→「Sign in with Apple」にチェック → Configure で Primary App ID に上の App ID。`.p8` のダウンロードは 1 回だけ |

Services ID と Private Email Relay の登録はしていない。前者は web の Apple ログインを
作るとき、後者は Apple でログインした人（中継アドレス `@privaterelay.appleid.com`）へ
メールを送る機能を作るときに要る。

鍵はアプリには入れない。サーバー（web）の環境変数として持つ。

### Supabase の設定

本番の Supabase は `config.toml` を読まない。ダッシュボードで設定する
（ローカルは `apps/web/supabase/config.toml` の `[auth.external.apple]` で設定済み）。

1. Authentication > Sign In / Providers > **Apple** を開く
2. **Enable Sign in with Apple** をオン
3. **Client IDs** に `help.mahjong.score`
4. **Secret Key (for OAuth)** は空のまま（web の Apple ログインでだけ要る。入れると 6 か月ごとの更新が必要になる）
5. Save

### サーバーの環境変数

web（Vercel と、手元で試すなら `apps/web/.env.local`）に入れる。無いと、ログインは
できるがトークンを保存できず、Apple でログインした人の退会で Apple の連携を取り消せない。

| 変数名                       | 値                                                               |
| ---------------------------- | ---------------------------------------------------------------- |
| `APPLE_TEAM_ID`              | `YV82X4FFX3`                                                     |
| `APPLE_KEY_ID`               | `Z93WHKSUHN`                                                     |
| `APPLE_PRIVATE_KEY`          | `.p8` の中身（`-----BEGIN PRIVATE KEY-----` から末尾まで）       |
| `APPLE_TOKEN_ENCRYPTION_KEY` | 保存するトークンを暗号化する鍵。`openssl rand -base64 32` で作る |

- `APPLE_TOKEN_ENCRYPTION_KEY` は環境ごとに作ってよいが、**一度使い始めたら替えない**。
  替えると保存済みのトークンが読めなくなり、その人たちの退会で取り消しが飛ばされる。
  作った値は 1Password に `.p8` と一緒に控える
- Vercel には `.p8` のファイルをそのまま渡せる:

  ```bash
  cd apps/web
  vercel env add APPLE_PRIVATE_KEY production < ~/Downloads/AuthKey_Z93WHKSUHN.p8
  ```

- `.env.local` は 1 行で書く。改行を `\n` にした文字列を作る:

  ```bash
  awk '{printf "%s\\n", $0}' ~/Downloads/AuthKey_Z93WHKSUHN.p8
  ```

  出力を `APPLE_PRIVATE_KEY="…"` の `…` に貼る。

鍵と設定が通るかは、存在しないトークンの取り消しで確かめられる（Apple は正しい鍵なら
200、Key ID・Team ID・App ID のどれかが違えば `invalid_client` を返す）。

## 実機で確かめる

Apple のログインは、`help.mahjong.score` で署名したビルドでしか通らない。Xcode と
Apple Developer のチームがあれば、開発ビルドを手元で作って iPhone に入れられる。

```bash
cd apps/mobile
npx expo run:ios --device   # 繋いだ iPhone を選ぶ。初回は数分かかる
```

- 初回は Xcode の Signing & Capabilities でチーム（Fuji LLC）を選ぶよう求められることがある
- iPhone 側で「設定 > 一般 > VPN とデバイス管理」から開発元を信頼する
- 開発ビルドは Metro に繋ぐので、Mac で上の「起動」の 3 つを動かしておく

確かめること:

1. 設定 > アカウント > ログイン で、メールのフォームの上に「Apple でサインイン」が出る
2. 押すと Apple のシートが出て、Face ID などで続けるとユーザー名の設定へ進む
3. Supabase Studio（http://127.0.0.1:54323）の Authentication > Users に、プロバイダが Apple のユーザーができている
4. `apple_refresh_tokens` に、そのユーザーの行が 1 つできている（サーバーの環境変数を入れたときだけ）
5. 退会すると、`account_deletions` の `apple_revoked_at` が入り、`apple_refresh_tokens` の行が消える。
   iPhone の 設定 > Apple アカウント > サインインとセキュリティ > Apple でサインイン から、このアプリが消えている
6. 同じ Apple ID でもう一度ログインすると、新しいアカウントとして始まる
7. トークンが無い状態の退会: Apple でログインし直した後、Supabase Studio の SQL Editor で
   `delete from apple_refresh_tokens;` を流してから退会すると、退会の前に Apple のシートが出る。
   確認を済ませると 5 と同じになり、シートを閉じると退会されずに案内が出る

サーバーの環境変数が無い環境では、Apple でログインした人は退会できない（Apple の連携を
取り消せないまま退会を受け付けないため。退会の画面に通信の失敗の案内が出る）。

## アプリ内課金（iOS）

iOS アプリは有料プラン Pro を App Store のアプリ内課金で売る。購入は web の Stripe と同じ
`purchases` の 1 行になり（`provider` が `apple`）、特典の判定は web と共通。web で買った Pro は
アプリで、アプリで買った Pro は web で有効。Android は Pro を扱わない。

仕組み:

1. アプリが StoreKit で購入し（`appAccountToken` にユーザーの id）、署名付き取引（JWS）を
   web の `/api/mobile/v1/iap/apple/transactions` に送る。サーバーが Apple のルート証明書で
   検証して記録し、2xx か 4xx が返ったらアプリが取引を完了（finish）する
2. Apple が返金などを `/api/apple/notifications`（App Store Server Notifications V2）に送る。
   サーバーは署名を検証して購入を取り消す。購入の記録より先に届いた返金も覚えておき、
   後から来た記録を取り消し済みで入れる
3. 「購入を復元」は端末にある取引を同じ API へ送り直す（買い切り向け。パスはログインで戻る）

App Store Server API の鍵は持たない。取引の現在値の照会・通知の履歴・TEST 通知の要求は
できない。

### App Store Connect の設定

アプリ（`help.mahjong.score`、Apple ID `6820905974` = `eas.json` の `ascAppId`）の
Monetization > In-App Purchases で 2 商品を作る。

| 売り方    | 種類                       | Product ID                          |
| --------- | -------------------------- | ----------------------------------- |
| 30 日パス | Consumable（消耗型）       | `help.mahjong.score.pro.pass30days` |
| 買い切り  | Non-Consumable（非消耗型） | `help.mahjong.score.pro.lifetime`   |

- 30 日パスを消耗型にしたのは、非更新サブスクだと購入シートのボタンが「サブスクリプションに登録」に
  なるため（理由と差し戻されたときの戻し方は `apps/web/src/lib/billing/apple/record.ts` の
  `APPLE_PRODUCT_TYPES`）。最初に作った非更新サブスクの `help.mahjong.score.pro.pass30` は消さずに
  残してあり、審査には出さない

- 価格は App Store の価格帯から選ぶ。アプリは StoreKit の表示価格（`displayPrice`）を
  出すので、価格を変えてもコードの変更は要らない。web の価格はアプリに出さない
- 表示名・説明（日本語）: 30 日パスは「購入から 30 日間、和了形・聴牌形の点数計算の
  回数制限が外れ、回答時間を計測できる。自動更新しない」、買い切りは同じ特典が永久に
  続く旨。プラン画面の文言（`packages/messages/src/ja/mobile-plan.json`）と食い違えない
- 審査用のスクリーンショットは、Sandbox で開いたプラン画面（マイページ > Pro プラン）を撮る
- **Family Sharing は両商品とも OFF**。サーバーも家族共有の取引を記録しない
- App Information > App Store Server Notifications で、**Production Server URL と
  Sandbox Server URL の両方**に `https://score.mahjong.help/api/apple/notifications` を
  入れ、Version 2 を選ぶ（Sandbox の通知も同じ本番サーバーに届き、サーバーが環境を見分ける）
- 初回は商品をアプリのバージョンと一緒に審査へ出す（App Review Information に下の
  デモアカウントを書く）

### サーバーの環境変数（Vercel）

web（Vercel と、手元で試すなら `apps/web/.env.local`）に入れる。どれも秘密ではない。

| 変数名                              | 値                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `APPLE_IAP_PRODUCT_ID_PRO_PASS`     | `help.mahjong.score.pro.pass30days`（任意。下の注を参照）                       |
| `APPLE_IAP_PRODUCT_ID_PRO_LIFETIME` | `help.mahjong.score.pro.lifetime`                                               |
| `APPLE_IAP_APP_APPLE_ID`            | `6820905974`（`eas.json` の `ascAppId`。Production の取引の検証に要る）         |
| `APPLE_IAP_SANDBOX_USER_IDS`        | Sandbox の取引に特典を付けてよい user_id（カンマ区切りの UUID）。下の許可リスト |

- **買い切りの Product ID が無ければ「販売していない」扱い**。アプリはプラン画面に
  商品を出さず、iOS の回数制限も掛けない（払えないペイウォールを出さない）。web の回数制限は
  Stripe の Price ID で別に決まる
- **30 日パスの Product ID は任意**。入れていなければアプリには買い切りだけが並ぶ（web の Stripe
  ではパスも売る）
- `APPLE_IAP_APP_APPLE_ID` が無いと検証器を作れない。アプリからの取引は 503 になり、アプリは
  取引を完了せずに残して次の起動で送り直す。通知は 500 になり、Apple が数日にわたって再送する
- `apps/web/.env.example` にもこの 4 つを足す（エージェントは `.env*` を読めないので人が足す）

### Sandbox の許可リスト

TestFlight・App Review・開発ビルドの購入はすべて **Sandbox** で、課金されずに本番サーバーへ
届く。全員に特典を付けると TestFlight の配布を受けた人が全員無料で買い切りを得るので、
Sandbox の取引は `APPLE_IAP_SANDBOX_USER_IDS` に載った user_id にだけ記録する（それ以外は 422 で
断る。アプリは取引を完了するが知らせは出さず、プラン画面は無料のまま）。Sandbox の購入は
追加購入の禁止に数えないので、テスターは何度でも買い直して試せる。

- **審査に出すときは、App Review のデモアカウントの user_id を必ず入れる。** 入れないと
  審査員の購入が 422 で止まり、「購入が完了しない」でリジェクトされる
- 運営のテスター（自分のアカウント）も入れる
- user_id はメールアドレスから引く。本番は Supabase の SQL Editor で、手元は
  `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` で:

  ```sql
  select id from auth.users where email = '<メールアドレス>';
  ```

- 変えたら Vercel を再デプロイする（環境変数はデプロイ時に読まれる）

### 実機で購入を確かめる

購入のシートと課金はシミュレーターの `sim:release` や Maestro では確かめない。実機と
**Sandbox テスター**で行う。

1. App Store Connect の Users and Access > Sandbox でテスターの Apple アカウントを作る
2. iPhone の 設定 > App Store > Sandbox アカウント でそのテスターにサインインする
   （ふだんの Apple アカウントはそのままでよい）
3. 次のどちらかでアプリを入れる
   - **手元の web に向ける**: 開発ビルド（`npx expo run:ios --device`。上の「実機で確かめる」）。
     接続先は自動で Mac の Supabase と web になる。`apps/web/.env.local` に上の 4 つを入れ、
     ログインするアカウントの user_id を許可リストに入れて web を再起動する
   - **本番に向ける**: TestFlight のビルド（`eas build --profile production`。「TestFlight に出す」）。
     本番の許可リストに自分の user_id を入れておく
4. ログインして マイページ > Pro プラン から買う。Sandbox のシートが出る
5. プラン画面の状態が「Pro（〜まで）」に変わり、購入履歴に行が増える
6. web の `/mypage/plan` にも同じ購入が「購入元: App Store」で出る。管理画面のユーザー詳細にも出る
7. 練習一覧の回数制限の表示が消え、和了形の点数計算に「回答時間を計測する」が出る
8. 「購入を復元」を押すと「復元できる購入はありませんでした」（記録済み）で、行は増えない

返金は Sandbox では App Store Connect から起こせない。`REFUND` / `REFUND_REVERSED` の処理は
単体テスト（`apps/web/src/lib/billing/apple/`）と統合テストに任せる。

### 通知が届いているか

TEST 通知は App Store Server API の鍵が無いと要求できない。代わりに Sandbox で買ったときの
`ONE_TIME_CHARGE` で確かめる:

- Vercel のログで `POST /api/apple/notifications` が 200 になっている（400 は署名の検証に失敗。
  500 は `APPLE_IAP_APP_APPLE_ID` が無いか DB の障害）
- DB の `apple_notification_events` に `notification_type = 'ONE_TIME_CHARGE'` の行ができている

### Apple のルート証明書を更新する

署名の検証に使うルート証明書（Apple Root CA - G2 / G3）は `apps/web/certs/apple/*.cer` に置き、
ソースに埋め込んで使う（`src/lib/billing/apple/root-certs.generated.ts`）。Apple が証明書を
替えたら、[Apple PKI](https://www.apple.com/certificateauthority/) から `.cer` を取り直して置き換え、

```bash
pnpm --filter web certs:generate
```

で生成物を作り直してコミットする（`root-certs.test.ts` が `.cer` と生成物の一致を検査する）。

### Android のビルドについて

`expo-iap` は Android でも Play Billing のライブラリをリンクするので、Android のビルドには
Billing のライブラリと `com.android.vending.BILLING` の権限が乗る。アプリのコードは Android で
課金の API を一切呼ばない（`src/billing/iap-availability.ts` の `IAP_AVAILABLE`）。Play Console が
ビルドを課金対応と見なすだけで、挙動は変わらない。
