# mahjong-scoring

麻雀の点数計算を学習するアプリ。

ここにはリポジトリ全体の方針（構成・用語・ルート・記録の土俵・行程）と Git の運用だけを置く。
場所ごとの規約は、その場所のファイルを読むと自動で入る `CLAUDE.md` にある:

| 場所                               | 中身                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/CLAUDE.md`       | 画面の規約: コロケーション・`"use client"`・共通 UI・色・ボタン・リンク・ローディング境界・牌画像 |
| `apps/web/CLAUDE.md`               | Proxy・DB マイグレーション・認証・開発用シード・Supabase ローカル・Preview の DB・ブラウザ実測    |
| `apps/mobile/CLAUDE.md`            | Expo アプリの規約（外観の置き換え・部品・認証と記録・確かめ方）                                   |
| `packages/features/CLAUDE.md`      | 共有ロジックの境界（`use-*.ts` だけが React に触れる・設定ストアのファクトリ・契約）              |
| `packages/core/CLAUDE.md`          | コーディング規約と Extended MPSZ 仕様の URL・牌の並び（理牌）                                     |
| `packages/eslint-config/CLAUDE.md` | TypeScript 7 と typescript-eslint の共存（`typescript` の 6 系エイリアスを外さない）              |
| `scripts/claude-cloud/CLAUDE.md`   | Claude Code クラウドセッション（VM）の足場                                                        |

コーディング規約（TSDoc・命名・Result 型）と牌の表記法は PaiForge の別リポジトリで一元管理し、
raw URL をコミット SHA で固定して読む（`packages/core/CLAUDE.md`・README・
`.github/claude/system-prompt.md`）。共有文書を更新したら `grep -rn raw.githubusercontent.com`
で全箇所の SHA を差し替える。ドメインロジックや TSDoc を書くタスクで読み、辞書・CSS・管理画面だけの
タスクでは要らない（規約の多くは ESLint が強制する）。

## 関連リポジトリ

- **旧リポ**: `/Users/k0kishima/work/PaiForge/mahjong-score-drill` — 以前の実装。コードの移植元として参照する。
- **参考プロジェクト**: `/Users/k0kishima/work/checkmate-works/blindfold-chess` — チェスアプリ。技術スタック（言語・フレームワーク・主要ライブラリの選定と構成）をこのプロジェクトと同一にする。バージョンまでは揃えない — 各リポジトリはそれぞれの都合で最新に追従する
- **PaiForge の npm パッケージ**（`@pai-forge/riichi-mahjong`・`@pai-forge/mahjong-react-ui`）: どちらも main へ
  マージすると CI が publish する（手動の `npm publish` やタグ push は二重実行になる）。こちらで依存を
  上げるコミットは publish 後に `pnpm install` で lockfile を更新してから作る — `^新版` だけ先に書くと
  `--frozen-lockfile` で落ちる。publish 前に消費側で確かめたいときは
  `node_modules/.pnpm/@pai-forge+<name>@…/node_modules/@pai-forge/<name>/` の dist をローカルビルドで
  上書きする（`pnpm install` で元に戻る）

## SPEC ファイルは足場であり成果物ではない

リポジトリルートの `SPEC*.md` は機能を作るための思考の足場で、記録ではない。
`.gitignore` 済みのため**作者のマシンにしか存在しない**。

- **コード・コメント・TSDoc から `SPEC*.md` を参照しない。** 他の読者には最初から
  壊れたリンクであり、参照した時点でそのコメントは自己完結性を失う。説明はコメント
  自身が全文を持つこと。長くなるなら、それが制約する宣言の TSDoc に置く —
  リポジトリ内で、コードと一緒にバージョン管理される場所に
- **機能を完成させるブランチで SPEC を削除する。** その際、コードから再導出できない
  内容（採らなかった選択肢とその理由、外部プラットフォームの挙動）は該当コードの
  TSDoc へ移し、未実装フェーズは単独で読める形で issue に移す
- 手順書・成果物リスト・進捗チェックボックス・ファイルパス一覧はそのまま捨てる。
  コードとテストと git 履歴が真実のソースであり、パス一覧は静かに腐る

## プロジェクト構成

```
apps/web/          — Next.js 16 (Turbopack, App Router, Tailwind CSS v4)
apps/mobile/       — Expo（expo-router, React Native）。web と同じ画面をネイティブで出す
packages/core/     — 共通ドメインロジック（問題生成等）。@pai-forge/riichi-mahjong 依存
packages/features/ — web とモバイルで共有するアプリのロジック（レジストリ・パス・セッションのフック・設定ストア）
packages/messages/ — i18n 辞書（ICU 形式。web は next-intl、モバイルは use-intl で同じ辞書を読む）
packages/eslint-config/ — 共通 ESLint 設定（PaiForge コーディング規約準拠）
```

`.ignore`（ルートと `apps/web/`）が `pnpm-lock.yaml` と `apps/web/drizzle/meta/`（マイグレーションの
スナップショット）を Grep の対象から外している。見たいときは `rg --no-ignore` かファイルを直接開く。

## モバイル（apps/mobile）

web と同じ画面をネイティブで出す Expo アプリ。web 側の作業で関わるのは次の 4 つだけ。

- アプリ向け API（`/api/mobile/v1/*`、`lib/mobile-api/`）の応答の形は `packages/features`
  の契約（`*/mobile-api.ts`）で決める。項目を足すときは省略可能にする — ストアに出ている
  版のアプリが古い形のまま読む
- web に広告の置き場所を足したら、アプリに同じ画面があればこちらにも足す（スロットは
  `MOBILE_AD_SLOTS`。成果をトラッキング ID で分けるため web とは別に持つ）
- 練習の回数制限（practice-quota）は iOS のアプリにも掛かる（同じ表・同じ規則。アプリ向け
  API `practice-quota`）。要求の本文の申告（「iOS から」等）で web の制限を外す経路は作らない
- 他の利用者を見せる画面（ランキング・公開プロフィール）と、他の利用者に見せる自由入力
  （表示名・自己紹介・SNS・アバター）は web だけのもの。web に足してもアプリには持ち込まず、
  アプリ向け API にも他の利用者の情報を返す経路を作らない（理由は `apps/mobile/CLAUDE.md`）

## i18n

- web の URL は「日本語は接頭辞なし・英語は `/en`」（next-intl の `as-needed`。言語は URL だけで決め、
  `Accept-Language`・cookie で推測しない）。ユーザー向けのルートは `apps/web/src/app/[locale]/` の下。
  規則の全文は `apps/web/src/i18n/` の各ファイルの TSDoc（`routing.ts`・`route-policy.ts`）
- **英語は許可リストで公開する。** 英語で出すページは `apps/web/src/i18n/translated-publications.ts` に
  載ったものだけで、他の `/en/...` は proxy が 404 + noindex を返す。page / layout の入口は
  `prepareRouteLocale(params, path)` で言語を確定させる（未公開なら 404）。リンク・hreflang・sitemap・
  言語切替は公開状態の表から組み、`/en` を手で付けない（`localizedHref` / `resolvePublishedHref`）
- 英語の辞書（`packages/messages/src/en.ts`）は完訳の名前空間だけを束ねる。英語で日本語へ fallback しない
- 辞書: `packages/messages/src/ja/<名前空間>.json`（名前空間ごとに 1 ファイル。モバイルと共有）。
  `src/ja.ts` が束ねて `messages` として公開する。名前空間を足したらそこに 1 行足す（`ja.test.ts` が食い違いを落とす）
- サーバーコンポーネント: `getTranslations()` / クライアントコンポーネント: `useTranslations()`
- UI コンポーネントに日本語をベタ書きしない
- モバイルは i18next ではなく use-intl（next-intl の土台）で同じ辞書を丸ごと読む。辞書キーは
  レジストリと結び付いた契約（`practice.practices.<messageKey>`・`<namespace>.variants.<key>`・
  `ranks.names.<slug>`）なので、辞書を 2 つに分けない
- キーをテンプレートリテラルで組む箇所（``t(`${option}.hint`)`` 等）は、完成形のキーの例を
  コメントに持つ。完成形で grep したときにその場所へ着地させるため。足すときも同じにする

## 用語（チャレンジ / トレーニング / 模試 / レッスン / コラム / セッション）

同じものを別の名前で呼ばない。この 6 語の意味は次に固定する。

| 語           | 意味                                                                                                                                                           | ユーザーに出すか |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| チャレンジ   | 制限時間とミス上限があり記録が残る 1 回の挑戦（昇級試験も含む）                                                                                                | 出す             |
| トレーニング | 時間無制限・記録なしで反復する練習                                                                                                                             | 出す             |
| 模試         | 昇級試験のトレーニング。本番と同じ出題を時間無制限・記録なしで解く                                                                                             | 出す             |
| レッスン     | 教本の章 1 つ（`/lessons/<slug>`）。「本文 → 確認問題（持つ章だけ）→ 完了」を 1 ページで通す学習の最小単位。完了だけが残る                                     | 出す             |
| コラム       | 目次のレッスンの間に差し込む読み物の章（`kind: "column"`）。本筋を読むのに要らない背景の話を置く。完了を持たず、進捗・「次はここから」・前後のリンクに数えない | 出す             |
| セッション   | play / training を問わない「解答中の一連の流れ」という内部の上位概念                                                                                           | 出さない         |

- **レッスンはチャレンジでもトレーニングでもない。** 時計もライフも無く、
  間違えてもその場で解説を読んで進む。記録は `lesson_completions` の「終えた」
  だけで正答数は持たない。レッスン = 教本の章で、一覧と順序は
  `packages/features/src/curriculum/registry.ts`、確認問題を持つレッスンの定義は
  `packages/features/src/lessons/registry.ts`（slug は章の slug。練習の slug と同じ文字列を
  使う章があるので、`machi-fu` のような slug の grep は練習とレッスンの両方に当たる）。確認問題を
  持たない章（はじめに・点数記憶術）は章末の「このレッスンを完了にする」で完了に
  なり、同じ印が付く。完了は「取り組んだ」印で正解の印ではなく、取り消しも無い。
  UI の呼び名は「レッスン」で、「教本」「章」「読了」はユーザーに出さない
  （以前は章が `/learn/<slug>`、レッスンが別の `/lessons/<slug>` にあり、章には
  「読了」の印もあったが、同じ章に 2 つの URL と 2 つの印が並んだため 1 つに
  畳み、URL は画面の呼び名に合わせて `/lessons` にした。`/learn` からの
  リダイレクトは無い — クロールされる前に移したため）

- **UI に「セッション」を出さない。** 1 回のチャレンジを指すなら「チャレンジ」と
  呼ぶ。唯一の例外は認証の「セッションが切れました」で、これはログイン状態という
  別概念
- コードで `session` を名乗ってよいのは両モードに共通する仕組みだけ
  （`isSessionRoute()` / `useTimedSession` / `useTrainingSession` /
  `sessionStorage` 関連）。チャレンジ 1 回分のデータを指す型・関数は
  `ChallengeAttempt` のように challenge を名乗る
- 制限時間・ミス上限は「セッションルール」ではなく「チャレンジのルール」。
  トレーニングには存在しない値だから
- 練習の「チャレンジ / トレーニング」の関係は試験にもそのまま当てはまる。
  本番の試験 = チャレンジ（合否判定・段級位の付与）、模試 = トレーニング
  （`/exam/<級>/training`）。UI では「模試」と呼び、コードでは練習と同じ仕組み
  なので `training` を名乗る（`createTrainingView` を試験のスラッグで呼ぶ）。
  模試は受験資格のガードを掛けず未ログインでも受けられる（記録も段級位の
  付与も無く、ガードが守るもの（級の順序）に触れないため）
- 道場（`/dojo`）は現在の段級位と「点数計算・黒帯への道」を見せるページ。その行程の計算を
  コードでは `journey`（`buildJourney()`）と呼ぶ。UI に「ジャーニー」を出さず、`/journey` の
  ようなルートも作らない

## ルート構成

```
/                           — LP（静的・cookie を読まない）。ログイン済みは proxy が /dashboard へ rewrite
/dashboard                  — ダッシュボード（ログイン済みトップの実体。URL は「/」のまま表示される）
/sign-in                    — ログイン（Google OAuth + メール）
/sign-up                    — アカウント登録（Google OAuth + メール）
/sign-up/verify-email       — メール確認待ち（確認メール再送機能付き）
/forgot-password            — パスワードリセットリンク送信
/reset-password             — 新パスワード設定（リセットメールのリンクから遷移）
/practice                   — 練習一覧
/practice/jantou-fu         — 雀頭符練習説明（レッスンへのリンク付き）
/practice/jantou-fu/play    — 練習本体
/practice/jantou-fu/result  — 結果表示
/lessons                    — レッスン一覧（セクション別の目次。完了を読む動的ルート）
/lessons/jantou-fu          — レッスン（静的・SEO重視でSSR。本文 → 確認問題 → 完了。登録直後の「次にやること」の行き先）
/dojo                       — 道場。現在の段級位（1 行）・次の目標の級（開いたカード）・「点数計算・黒帯への道」（全段級位の行程。閉じたカード）
/dojo/ranks/<級>            — 級の詳細（合格基準・前提章・試験）。/dojo/ranks（旧一覧）は /dojo へ 301
/plan                       — 料金ページ（Pro: 30 日パス / 買い切り。静的、価格は Stripe から 1 日キャッシュ）
/mypage/plan                — 購入状況と購入履歴（動的）
/tokushoho                  — 特定商取引法に基づく表記
/api/stripe/webhook         — Stripe Webhook（署名検証・重複排除）
/api/apple/notifications    — App Store Server Notifications（署名検証・重複排除）
/api/stripe/checkout/complete — Checkout 完了の着地（所有者検証 → 同期記録 → /mypage/plan）
```

### 練習ページ構成パターン

| パターン     | 構成                                         | 該当                                                                                       |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| チャレンジ型 | 説明(page.tsx) → play → result（+ training） | `PRACTICE_MENU_REGISTRY`（`packages/features/src/practice-menu-types.ts`）に載る練習すべて |
| 無限訓練型   | play のみ（result なし）                     | agari-score, tenpai-score                                                                  |

- `agari-score` / `tenpai-score` は終了条件がなく無限ループする訓練機能のため、result ページを持たない。
  どちらも `PRACTICE_MENU_REGISTRY` に載らず、練習一覧のバナー（`practical-practice-banners.tsx`）と
  `apps/web/src/app/_lib/sitemap-routes.ts` の手書きの 1 行で参照する
- `tenpai-score`（聴牌形の点数計算）は 1 問を「待ち牌を選ぶ → 待ち × ツモ/ロン のマスに点数を当てはめる →
  答え合わせ」の 3 段階で解く。設定画面・回答フォーム・結果表は `agari-score` のものを共有し、設定の保存名だけ分ける
- チャレンジ型の練習を足す手順（レジストリから導出されるもの・型やテストが要求する場所・黙って既定値に
  落ちる場所）は `practice-menu-types.ts` の `PRACTICE_MENU_REGISTRY` の TSDoc

## 出題設定（バリアント）と記録の土俵

チャレンジの記録は `(menu_type, leaderboard_key)` の土俵ごとに積まれ、
マイレコード・自己ベストの比較もその単位で引く。`leaderboard_key` は出題設定の
**バリアント**で、`PRACTICE_MENU_REGISTRY` の `variants` に列挙したキー
（設定を持たない練習は `DEFAULT_VARIANT` = `"default"`）。

- **ランキングは練習ごとに 1 つ。出題範囲を選べる練習は「すべて」（`ALL_VARIANT` = `"all"`）だけ。**
  範囲を絞ったバリアントは練習の足場で、その回も記録（自己ベスト・マイレコード）は
  残るがランキングには載らない。範囲ごとに土俵を並べると一覧が膨らみ、成績が散って
  母集団も薄くなる。ランキングに載るバリアントはレジストリの `rankedVariants`
  （省略時は `all` を列挙していれば `all` だけ）で、`LEADERBOARD_BOARDS`・
  `resolveLeaderboardBoard()` はこれを引く。範囲を選べる練習を足すときは
  完成形のバリアントを `all` と名付ける。ランキングに載らない範囲の URL・結果ページは
  「すべて」のランキングに寄せる。`challenge_best_scores` の絞った範囲の行は自己ベストとして
  読むので消さない
- **練習の設定は、レジストリに列挙した少数のバリアントから 1 つ選ぶ形に限る。**
  チェックボックスの自由な組み合わせは作らない — 列挙できない設定は土俵に
  名前を付けて並べることも比較することもできない
- バリアントのキーは URL の `?variant=`・`leaderboard_key`・辞書キー
  （`<namespace>.variants.<key>.{label,hint}`）で同じ文字列を使う。変換の表を持たない
- 読む側は必ず `resolvePracticeVariant()` で正規化する（未指定・不正値は先頭の既定）。
  盤面・保存・結果ページが同じ URL から同じ土俵に着地するため
- 説明ページの選択 UI は共通の `VariantStartPanel`。練習ごとに設定 UI を書かない
- `/preferences` のルール設定（連風牌4符・切り上げ満貫等）は端末ローカルで、
  `leaderboard_key` に載せない（端末を変えた瞬間に記録が別の土俵へ飛ぶ）。
  代わりにチャレンジ（記録あり）では設定で正解が割れる手を出題から落とし、
  点数の選択肢を設定に依らない集合に固定する（方針の全文は
  `packages/features/src/challenge/rule-boundary.ts` の TSDoc）。トレーニングは設定どおりに出題する
- 昇級試験は記録を残さない（`submitExamResult` が合否だけ判定して `user_ranks` に
  付与する）。`savePracticeResult` は試験の menuType を入口で弾く
- Pro の購入は web の Stripe・iOS の App Store・Android の Google Play の経路で、どれも `purchases`
  の 1 行になる（`purchases.provider`）。特典の判定（`hasBenefit`）は経路を知らない。App Store の
  Sandbox（TestFlight・審査）と Google Play の Test の購入は許可リスト（`APPLE_IAP_SANDBOX_USER_IDS` /
  `GOOGLE_IAP_TEST_USER_IDS`）のユーザーにだけ記録する（運用の手順は `apps/mobile/README.md`「アプリ内課金」）。
  Google Play は記録の経路だけで、検証器は開発用のモックしか無く、本番では販売していない

## 点数計算・黒帯への道（段級位の行程）

段級位（5級 → … → 初段 = 黒帯）を 1 本の道として見せる。級ごとに
「学ぶ（レッスン）→ 練習する → 認定される（試験）」の 3 段を持ち、計算は
`packages/features/src/journey/journey.ts` の `buildJourney()` に一本化する。
ダッシュボードの「次にやること」・道場の行程・登録直後の案内はすべてこれを読み、
置き場所ごとに「次」を別々に決めない（ホームと道場で指す先が食い違う）。
方針の全文（「学んだ」= レッスン完了、「練習した」= 一度でも挑戦、順序は案内で強制ではない、
`isFresh`、模試の扱い、読む順）は同ファイルの頭の TSDoc にあり、ここでは繰り返さない。

- **ホームは「今すること 1 つ」、道場は「全体の道筋」。** ダッシュボードは
  次に取る級の中で最初の未了を 1 つだけカードに出す（候補を並べない）。
  道場は次の目標の級を開いて上に置き、その下に全級を閉じたカードで並べる
  （次の目標の級も道の中では閉じる。中身を 2 回出さない）
- **順序は案内であって強制ではない。** 受験資格は級の順序だけ（`evaluateExamEligibility`）。
  前提のレッスンの完了を受験の条件にせず、EXP レベル等で教材や練習を鍵付きにしない
- 見出しは常に「次にやること」で、初回だけ別の見出しや初回限定のカードは持たない

## リリースとバージョン（タグ）

- **タグを付けるのは `apps/mobile` だけ。** ストアに出す版ごとに注記付きタグ `mobile@<version>` を、
  その版のビルドを作ったコミットに付ける（`<version>` は `apps/mobile/app.json` の `expo.version`）。
  web は Vercel で随時デプロイし、コミット SHA がそのまま版。`packages/*` は publish せず、
  `package.json` の `version` は触らない。Changesets 等のツールは入れない
- iOS と Android は同じ番号の系列を共有し、1 つの番号 = 1 つのコミット（使い回さない）。
  ビルド番号は EAS が持ち、タグに載せない
- 番号の上げ方・タグの付け方・注記の書式・過去の版の引き方は `apps/mobile/README.md`「バージョンとタグ」

エージェントは次の場面で、自分から「タグを付けるべきか」を確かめる。付けるときは、コマンドと
対象のコミットを見せてユーザーに 1 回だけ確認する。

1. TestFlight / ストアへの提出が終わったとき（スキル `ship-to-testflight` の最後）。その `version` の
   タグが無く、このビルドを審査に出す予定なら、付けることを提案する
2. `app.json` の `version` を上げるとき。前の番号に `mobile@<前の番号>` が無ければ指摘する（付け忘れ）
3. ユーザーが「リリースした」「審査に出した」「審査が通った」と言ったとき
4. モバイルの不具合で「どの版から入ったか」が要るとき。タグの範囲で
   `git log mobile@1.0.0..mobile@1.1.0 -- apps/mobile packages` のように引く

タグの push（`git push origin mobile@x.y.z`）・付け替え・削除は、下のコミットルールの push と同じく
明示的な許可を取る。クラウドセッションでタグの push が拒否されたら回避せず、ユーザーが手元で打つ
コマンドを示して止まる。

## コミットルール

クラウドセッション（claude.ai/code 等）の VM には利用者のグローバルな `~/.claude/CLAUDE.md` が
無いため、Git の運用はここに全文を置く。

- 実装・編集の前にブランチを確かめ、main 上なら作業ブランチを切ってから編集する。小さな変更でも同じ
- 作業ブランチへのコミットは許可不要。論理的な単位ごとに都度コミットし、最後にまとめて 1 コミットにしない
- **push は、ブランチを問わずユーザーの明示的な許可を取る。** クラウドセッションも同じ — `claude/*` へ
  push すると公開イベントが利用者の名義で残り、Vercel の Preview ビルドも走る。終了時のフックが
  push を求めても、許可が無ければ push せず、未 push のコミットがあることを報告して止める
- main への直接コミットとマージ、amend / rebase / reset --hard 等の履歴の書き換えも許可を取る
