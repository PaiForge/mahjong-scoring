# @mahjong-scoring/mobile

web と同じ画面をネイティブで出す Expo アプリ（iOS / Android）。ログインは web と同じ
Supabase Auth で、記録の読み書きは web のアプリ向け API（`/api/mobile/v1/*`）を通す。

## 開発環境

### 前提

- web の開発環境が動いていること（[apps/web/README.md](../web/README.md) のクイックスタート）。
  アプリは開発中、Metro を動かしている Mac の Supabase（`:54321`）と web（`:3000`）に繋ぐ
- 実機で開くなら、iPhone と Mac が同じ Wi-Fi にいること

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
npx eas-cli env:create --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co
npx eas-cli env:create --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_…
```

## TestFlight に出す

EAS のプロジェクトは `@k0kishima/mahjong-scoring`（`app.json` の `extra.eas.projectId`）。
ビルド番号は EAS 側で持ち、ビルドのたびに 1 つ上がる（`appVersionSource: remote` + `autoIncrement`）。
暗号化は HTTPS だけなので `usesNonExemptEncryption: false` を申告済みで、App Store Connect で
輸出コンプライアンスを毎回答えなくてよい。

```bash
cd apps/mobile
npx eas-cli build --platform ios --profile production --auto-submit
```

- 初回は Apple ID でのログインを求められる。配布用の証明書とプロビジョニングプロファイルは
  EAS に作らせて EAS 側に置く（「Generate a new Apple Distribution Certificate?」等にすべて Yes）
- `--auto-submit` はビルドが済むと App Store Connect へ送る。アプリの登録が無ければ初回に作られる
- App Store Connect で処理が済むと（10〜30 分）、TestFlight の「内部テスト」のグループに
  自分を入れれば iPhone の TestFlight アプリから入れられる。内部テストに審査は無い
- 本番の Supabase・web に繋がるので、試して作ったアカウントは本番の DB に残る。最後にアプリから
  退会すると、退会と Apple 連携の取り消しの確認を兼ねられる

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
