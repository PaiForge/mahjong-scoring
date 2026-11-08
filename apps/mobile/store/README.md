# App Store の素材

App Store Connect（ASC）の製品ページに入れる文と URL を、ロケールごとのディレクトリに置く。
いまあるのは英語（`en-US/` = ASC の English (U.S.)）だけ。日本語の現行の素材は ASC にだけあり、
ここには写していない。

ASC にだけある素材はレビューも差分も残らない。ファイルにしておくと、辞書の訳文と同じ検査
（`src/store-listing/store-listing.test.ts`）を掛けられ、ASC を更新するときにそのまま貼れる。

**ASC の更新は別の承認で行う。** このディレクトリを直しても ASC は変わらない。貼る・上げる
（API の `patch` / `post` を含む）のは、利用者が承認したときだけにする。

## 欄と上限

| ファイル                   | ASC の欄                                             | 貼る画面（ASC）                                                                   | 上限（字） |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `name.txt`                 | Name                                                 | App Information > Localizable Information                                         | 30         |
| `subtitle.txt`             | Subtitle                                             | App Information > Localizable Information                                         | 30         |
| `urls.json` の `privacy`   | Privacy Policy URL                                   | App Information > Localizable Information                                         | —          |
| `promotional_text.txt`     | Promotional Text                                     | 準備中のバージョン（iOS App > <版>）の English (U.S.)                             | 170        |
| `description.txt`          | Description                                          | 同上                                                                              | 4000       |
| `keywords.txt`             | Keywords                                             | 同上                                                                              | 100        |
| `release_notes.txt`        | What's New in This Version                           | 同上（初版には欄が無い）                                                          | 4000       |
| `urls.json` の `support`   | Support URL                                          | 同上                                                                              | —          |
| `urls.json` の `marketing` | Marketing URL                                        | 同上                                                                              | —          |
| `iap/<Product ID>.json`    | Display Name（`name`）・Description（`description`） | Monetization > In-App Purchases > 商品 > App Store Localization の English (U.S.) | 30 / 45    |

- ファイルの末尾の改行は貼らない（検査も末尾の改行 1 つを除いて数える）
- 英語のロケールは ASC の画面で Localizable Information の言語の切り替えから English (U.S.) を
  足してから貼る。アプリのホーム画面の名前（"Mahjong Scoring"）は `app.json` の `locales` が持ち、
  ASC の Name（"Riichi Mahjong Scoring"）とは別。ホーム画面は 12〜13 字で切れるので短くし、ストアの名前は
  web の英語の説明と同じ語にしてある
- キーワードはカンマ区切りで、カンマの後に空白を入れない（空白も字数に入る）。Name と Subtitle の
  語は ASC が検索に使うので、キーワードに重ねない（検査が Name の語を落とす）
- アプリ内課金の表示名はプラン画面の商品名（辞書の `mobilePlan.offers.*.title`）と同じにする。
  説明は辞書の `mobilePlan.offers.*.description` と同じ意味にする（`apps/mobile/README.md`
  「アプリ内課金」）。表示名・説明は購入シートと領収書に出る
- URL は本番の web の英語のページ。英語で公開済みのパス（`/en`・`/en/privacy`・`/en/contact`）だけを使う。
  公開状態の表は web の `apps/web/src/i18n/translated-publications.ts`

## 書くこと・書かないこと

- 書くのはアプリの実画面にある機能と、辞書の英語の語（`landing`・`aboutThisApp`・`mobilePlan`・
  `practice`・`dojo`・`practiceQuota`。訳語は `packages/messages/src/terminology.ts`）
- 書かない（検査が語で落とすものを含む）:
  - 価格・通貨・税。アプリは StoreKit の価格を出し、web の価格に触れない（審査ガイドライン 3.1.1）
  - 定期購読に見える語（subscription）。どちらの商品も自動更新しない
  - 他の OS（Android・iPad）。iPad は対象外（`app.json` の `supportsTablet: false`）
  - web だけの機能（ランキングの一覧・公開プロフィール）。アプリは他の利用者を見せない
    （`apps/mobile/CLAUDE.md`）
  - まだ無い機能

## スクリーンショット

PNG はリポジトリに入れない（フロー `.maestro/store-screenshots.yaml` から撮り直せ、版を上げるたびに
差し替えるバイナリになる）。6.9 インチ（ASC が必須とするサイズ）の `iPhone 17 Pro Max` に Release
ビルドを入れ、英語で撮る。

```sh
pnpm --filter @mahjong-scoring/mobile sim:release "iPhone 17 Pro Max"
SIMULATOR_NAME="iPhone 17 Pro Max" MAESTRO_LOCALE=en MAESTRO_OUTPUT_DIR=<置き場所> \
  pnpm --filter @mahjong-scoring/mobile maestro store-screenshots
```

手元の web（`:3000`）と dev seed が要る。撮る 8 画面と順、時計の固定は `.maestro/README.md`
「ストア用の撮影」。英語への対応のときに撮ったものは
`~/.claude/handoffs/mahjong-scoring/2026-11-08-english-i18n-phase5/artifacts/store-screenshots/`
（作者の手元だけにある）。ASC へは準備中のバージョンの English (U.S.) の 6.9" Display に上げる。

## 訳文の検査

英語のネイティブのレビューの代わりに、次を重ねる。

1. 形: 辞書の `en.test.ts`（葉・ICU の引数・日本語の残存）。素材は ICU を持たない
2. 訳語: `terminology.test.ts`（`avoid` の語・Apple の表記）。素材には `store-listing.test.ts` が
   同じ `avoid` を掛ける
3. 綴り・文法: `translation-audit`（cspell + retext）。素材の各欄に `auditEnglishText` を掛け、
   `error` は 0 件にする
4. 訳し戻し: 訳した人が、原文を見せない別の読み手（会話を継承しないエージェント）に英語だけを
   渡して日本語に訳し戻させ、原文と比べて意味・数・条件・否定・主語の落ちを直す
5. 独立の審査: 訳した人とは別の読み手が、訳し戻し・検査の結果・英語の実画面で見直す
6. 実画面: 英語の Release ビルドで撮った画面を見て、切れ・折り返し・日本語の残存を確かめる
7. 素材: `store-listing.test.ts` が上限・日本語の残存・`avoid`・うたわない語・URL・アプリ内課金の
   表示名を検査する。「うたった機能が実画面にある」は 6 のスクリーンショットと突き合わせる

検査を流す:

```sh
pnpm --filter @mahjong-scoring/mobile exec vitest run src/store-listing
```

ASC に入っている値が揃っているか（読み取りだけ）は `uv run scripts/asc.py audit`
（`apps/mobile/README.md`「審査に出す前の確認」）。
