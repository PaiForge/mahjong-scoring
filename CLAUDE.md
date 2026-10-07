# mahjong-scoring

麻雀の点数計算を学習するアプリ。

## 関連リポジトリ

- **旧リポ**: `/Users/k0kishima/work/PaiForge/mahjong-score-drill` — 以前の実装。コードの移植元として参照する。
- **参考プロジェクト**: `/Users/k0kishima/work/checkmate-works/blindfold-chess` — チェスアプリ。技術スタック（言語・フレームワーク・主要ライブラリの選定と構成）をこのプロジェクトと同一にする。バージョンまでは揃えない — 各リポジトリはそれぞれの都合で最新に追従する

## コーディング規約

新しいセッション開始時は以下を読み込むこと:

- コーディング規約 — https://raw.githubusercontent.com/PaiForge/docs/0b464878e4e24b6b8c154d90f96e1657e212ddaa/coding-standards.md
- Extended MPSZ（牌の表記法）の仕様 — https://raw.githubusercontent.com/PaiForge/extended-mpsz/72ee9ede74583d58587bc8c6ed36166bb808b5bd/SPEC.md

どちらも別リポジトリ（[PaiForge/docs](https://github.com/PaiForge/docs)・
[PaiForge/extended-mpsz](https://github.com/PaiForge/extended-mpsz)）で管理している共有文書で、
submodule では取り込まず raw URL で読む（jj など git 以外の VCS へ移れるようにするため）。
URL はコミット SHA で固定している — `main` を指すと、読む時点によって規約が変わる。
共有文書を更新したら SHA を差し替える（ここと `.github/claude/system-prompt.md`・README の 3 か所）

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

## App Router コロケーション規約

`src/app/` 配下では、ルート規約ファイル（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 等）以外のディレクトリには `_` プレフィックスを付けること。

- `_components/` — コンポーネント
- `_hooks/` — カスタムフック
- `_lib/` — ユーティリティ

これにより、App Router のルート解決対象から除外され、ルートセグメントと明確に区別できる。

## `"use client"` 使用基準

- `"use client"` は本当にクライアント側の機能（hooks, event handlers, browser API）が必要な場合のみ付与する
- `useTranslations()` だけのために `"use client"` を付けない。サーバーコンポーネントでは `getTranslations()` from `next-intl/server` を使用する
- 新規コンポーネント作成時にサーバーコンポーネントとして実装できないか必ず検討する

## Next.js Proxy（旧 Middleware）

- Next.js 16 では `middleware.ts` は `proxy.ts` に置き換えられた。**`middleware.ts` は使用禁止**
- セッションリフレッシュ等の処理は `apps/web/src/proxy.ts` に記述すること
- `middleware.ts` と `proxy.ts` が同時に存在するとビルドエラーになる

## TypeScript 7 と typescript-eslint の共存

アプリ（`apps/web`, `packages/core`）は TypeScript 7 を使う。ただし typescript-eslint は TS7 を実行時に拒否するため、`packages/eslint-config` の devDependencies で `typescript` を `npm:@typescript/typescript6` にエイリアスし、typescript-eslint が解決する `typescript` だけを 6 系に固定している。

- **この固定を外さないこと。** 外すと peer が TS7 に解決され `pnpm lint` が起動しなくなる
- typescript-eslint が TS7 を peer で受け入れたら不要（typescript-eslint#10940）
- エディタは「Use Workspace Version」が使えない（TS7 は `tsserver` を同梱しない）。TS7 用拡張を使うこと

## プロジェクト構成

```
apps/web/          — Next.js 16 (Turbopack, App Router, Tailwind CSS v4)
apps/mobile/       — Expo SDK 57（expo-router, React Native 0.86）。web と同じ画面をネイティブで出す
packages/core/     — 共通ドメインロジック（問題生成等）。@pai-forge/riichi-mahjong 依存
packages/features/ — web とモバイルで共有するアプリのロジック（レジストリ・パス・セッションのフック・設定ストア）
packages/messages/ — i18n 辞書（ICU 形式。web は next-intl、モバイルは use-intl で同じ辞書を読む）
packages/eslint-config/ — 共通 ESLint 設定（PaiForge コーディング規約準拠）
```

## packages/features

web とモバイル（Expo）で共有するロジックを置く。`exports` は `./*` のファイル単位で、
消費側は `@mahjong-scoring/features/<path>` で必要なファイルだけを import する（バレルは作らない）。

- **React・zustand・use-intl に触れてよいのは `use-*.ts` だけ。** それ以外の純粋なモジュールは
  サーバーコンポーネントからも Node のテストからも読める状態に保つ。純粋なモジュールから
  `use-*.ts` を import することも禁止。どちらも ESLint（ルートの `eslint.config.mjs`）が弾く
- 辞書を引くフックは next-intl ではなく use-intl の `useTranslations` を使う。next-intl の
  クライアント用 `useTranslations` は use-intl のものを包んだだけで、`NextIntlClientProvider` も
  use-intl の Provider なので、web とモバイルの両方で同じに動く（`yaku/use-yaku-options.ts`）。
  use-intl は web・モバイル・features で同じ版にそろえる（版が分かれると Provider のコンテキストが別物になる）
- 設定ストアはファクトリ（`createRuleSettingsStore` 等）で、保存先とハイドレーションガードを
  アプリが渡す。web の実体は `app/_hooks/use-*-store.ts`（localStorage・`useHydrated`）
- web 固有のもの（DOM・Next・next-intl・Tailwind）は置かない。パスは両プラットフォームにある
  遷移先だけ `routes.ts` に置き、一覧の絞り込みやアンカーは web に残す

## モバイル（apps/mobile）

web と同じ画面をネイティブで出す Expo アプリ。技術スタック（Expo + expo-router）は
参考プロジェクト（blindfold-chess の apps/mobile）に揃えている（バージョンは揃えない）。ロジックは
packages/features / core を共有し、アプリ側は画面と RN の部品だけを持つ。

**仕様は web を踏襲するが、外観まで web を写さない。** スマホアプリとして見慣れない
形（地の斜線の帯・太枠のヘッダーとタブバー・グレー + 下線のリンク・中央の太枠の
ダイアログ）はネイティブの定石に置き換える。残すのは面の記号（太枠・ハードシャドウ・
押し込み・緑の塗り = 押して始める）と色の値。

- 画面の枠（`components/screen.tsx`）はネイティブ標準: 白地のヘッダー（左に戻る / ×、
  中央に見出し、右に「?」等）とヘアラインの区切り。解答中の画面（チャレンジ・
  トレーニング・訓練）は `backIcon="close"` で「閉じる」を出し、チャレンジだけ中止の
  確認を挟む。履歴が無いときの戻るは練習一覧へ
- リンクは下線を引かない（`lib/link-styles.ts`）。押せる行は濃い題名 + 右端の矢印 +
  押したときの地の色、単独の文字の操作はアクセント色の太字、本文中の語だけ下線
- 説明・選択肢の一覧・選択欄は `BottomSheet`（下からのシート）。確認だけ中央の
  ダイアログ（`ConfirmationModal`）
- 「?」のヘルプは `HelpTourSheet`（1 枚ずつ送るシート）。web の 2 種類（設定画面の
  `HelpTourModal` と画面の要素を照らす `SpotlightTour`）を、どちらもこの形で出す
  （要素を照らす仕組みはネイティブに無い。進め方の方だけ実物の見本を添える）
- 一覧の絞り込みは `FilterChips`（端まで流す独立したチップ）、2〜3 択の表示切り替えは
  `ToggleGroup`（セグメントコントロール）
- 答え合わせは色に加えて触覚（`lib/haptics.ts`、expo-haptics）でも知らせる
- 本文の文字は 15〜16pt（web の 14px を写さない）。辞書の改行は設定の説明では取り除く

- **画面の構成は web をなぞる。** ルートは expo-router で web と同じパス（`/practice/<slug>`,
  `/practice/<slug>/play` …）に置き、パスは `@mahjong-scoring/features/routes` で組み立てる。
  練習ごとに違うのは盤面と結果の一覧だけで、`src/practice/boards/<slug>/index.tsx` が
  `PracticeScreens`（Play / Training / Demo / ProblemList）を返し、`src/practice/registry.ts` に
  1 行足すと一覧・説明・チャレンジ・トレーニング・結果のすべてに載る
- **ログインはまだ無い。** チャレンジは結果画面で今回の成績を見せるだけで記録しない（記録・
  ランキング・段級位はアカウントに紐づくため）。結果はメモリのストアで結果画面へ運ぶ
  （web の sessionStorage の代わり）。設定・レッスンの完了・「チャレンジを終えた練習」
  （黒帯への道の「練習した」。成績は持たない）は端末ローカル（AsyncStorage）
- **色・角丸の値は web から写す。** `src/lib/theme.ts`（web の `globals.css` と同じ値）。
  太枠・ハードシャドウ・押し込みは `PressableSurface`（影は面の後ろに敷いた View で描く。
  Android の elevation は硬い影を描けない）。影を持つのは押せる面だけ（web と同じ規則）
- **表示だけのカード・表・設定のカード・一覧の枠は細枠。** `lib/panel-styles.ts` の `panelFrame`
  （1px の `colors.panel` + `radius.panel`。web の `rounded-panel border border-panel`）を使い、太枠
  （`borderWidth.regular` + `colors.ink`）は押せる面・回答欄・ダイアログに残す。段級位のカードは
  `beltCardFrame()`（細枠 + 上端の帯色の帯）、小さな印は `Chip`、区切りは `Divider`（破線は使わない）
- **牌は `Hai` / `FuroTiles` を使う。** `@pai-forge/mahjong-react-ui` の `Furo` /
  `HaiBack` / `Tehai` は `div` と Tailwind のクラスで描く web 専用の実装で、ネイティブでは描けない。
  `Hai` は 0.5.0 から `onClick` が無ければ `View` で包まれ、ボタンの中に置いてもタップを奪わない
  （0.4.0 までは常に `Pressable` で包まれ、ネイティブでは画像も描かれなかった）
- **Expo SDK の推奨と違う版を 3 つ意図して使う**（`package.json` の `expo.install.exclude`）。
  `npx expo install --fix` で戻さないこと
  - `react` / `react-dom` — ワークスペース全体と同じ版にそろえる。packages/features も devDependency で
    React を持ち、版が違うと pnpm が別の実体を置き、Metro が共有コードの React を別に解決して
    React が 2 つバンドルに入る（フックが落ちる）。RN のレンダラーは React の版を厳密には検査しない
  - `typescript` — 他のパッケージと同じ TS7。SDK 54 では Expo の CLI が TS7 で Metro まで届かず
    5.9 に固定していたが、SDK 57 では `expo start` から iOS / Android / web のバンドルまで通る
- **web 版（`pnpm --filter @mahjong-scoring/mobile web`）は画面確認用**
- 辞書は web と同じもの（`@mahjong-scoring/messages`）を use-intl で読む

## i18n

- `next-intl` をルーティングなしで使用（locale は `ja` 固定、将来英語対応予定）
- 辞書: `packages/messages/src/ja/<名前空間>.json`（名前空間ごとに 1 ファイル。モバイルと共有）。
  `src/ja.ts` が束ねて `messages` として公開する。名前空間を足したらそこに 1 行足す（`ja.test.ts` が食い違いを落とす）
- サーバーコンポーネント: `getTranslations()` / クライアントコンポーネント: `useTranslations()`
- UIコンポーネントに日本語をベタ書きしない
- モバイルは i18next ではなく use-intl（next-intl の土台）で同じ辞書を読む。辞書キーは
  レジストリと結び付いた契約（`practice.practices.<messageKey>`・`<namespace>.variants.<key>`・
  `ranks.names.<slug>`）なので、辞書を 2 つに分けない。モバイルは使う名前空間だけを
  分割代入で束ね直して渡す

## 用語（チャレンジ / トレーニング / 模試 / レッスン / セッション）

同じものを別の名前で呼ばない。この 5 語の意味は次に固定する。

| 語           | 意味                                                                                                                       | ユーザーに出すか |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| チャレンジ   | 制限時間とミス上限があり記録が残る 1 回の挑戦（昇級試験も含む）                                                            | 出す             |
| トレーニング | 時間無制限・記録なしで反復する練習                                                                                         | 出す             |
| 模試         | 昇級試験のトレーニング。本番と同じ出題を時間無制限・記録なしで解く                                                         | 出す             |
| レッスン     | 教本の章 1 つ（`/lessons/<slug>`）。「本文 → 確認問題（持つ章だけ）→ 完了」を 1 ページで通す学習の最小単位。完了だけが残る | 出す             |
| セッション   | play / training を問わない「解答中の一連の流れ」という内部の上位概念                                                       | 出さない         |

- **レッスンはチャレンジでもトレーニングでもない。** 時計もライフも無く、
  間違えてもその場で解説を読んで進む。記録は `lesson_completions` の「終えた」
  だけで正答数は持たない。レッスン = 教本の章で、一覧と順序は
  `packages/features/src/curriculum/registry.ts`、確認問題を持つレッスンの定義は
  `packages/features/src/lessons/registry.ts`（slug は章の slug）。確認問題を
  持たない章（基礎・点数記憶術）は章末の「このレッスンを完了にする」で完了に
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

## 共通UIコンポーネント

置き場所は 2 つに分かれる。ディレクトリで「管理画面が使うか」を表現している。

| ディレクトリ                           | 中身                                                                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/_components/`        | ユーザー向け画面と管理画面（`/admin`）で共有するもの。`BrandLogo` / `SkeletonBar` / `PageTitleSkeleton` / `ModalShell` / `GlobalToaster` / `ScrollReset` / `_lib/link-classes` のみ |
| `apps/web/src/app/(user)/_components/` | ブランド UI（太枠・ハードシャドウ・押し込み演出の世界）。上記以外はすべてここ                                                                                                       |

新しい共通コンポーネントは原則 `(user)/_components/` に置く。`app/_components/`
へ足すのは管理画面からも使うときだけ。`app/_components/` 側から
`(user)/_components/` を import しない（依存の向きを一方向に保つ）。

例外は 1 つだけ: ルートの `app/not-found.tsx` / `app/error.tsx` — `(user)` 配下ではないがユーザーに見える画面なので、ブランド UI を使う。

管理画面は `(user)/_components/` を import しない（ページ送りも `AdminPaginationNav` を持つ）。
ボタン・入力欄・状態チップは `admin/_lib/` の `adminButtonClasses()` / `ADMIN_INPUT_CLASSES` /
`adminChipClasses()` に集約しており、ページ側で一式を直接書かない。

### 主なコンポーネント

- `PageTitle` — h1。全ページで使用
- `SectionTitle` — h2。左の短い縦線・文字・右へ伸びる淡い横線
- `ContentContainer` — ページコンテンツの max-w-3xl ラッパー。全ページで統一して使用し CLS を防ぐ
- `Sidebar` / `MobileHeader` / `MobileTabBar` — ナビゲーションシェル
- `DataTable` / `DataTableHeaderCell` — データテーブルの外枠と見出しセル。表を作るときは直接 `<table>` を書かない
- `LinkRow` / `LinkRowList` — 読む・見るためのリンク 1 行とその枠。太枠 + ハードシャドウ + 押し込みは「押して始める面」（練習・試験・登録）の記号なので、ページを読みに行くだけ / 一覧を見に行くだけの導線はカードにせずこれを使う
- `SkeletonBar` — 読み込み中のプレースホルダ矩形。`animate-pulse` と背景色を直接書かない。角丸は `radius`（md / lg / xl / full）で指定し、`className` に `rounded*` を書かない
- `PageTitlePlaceholder` / `AdminPageTitlePlaceholder` — 読み込み中の見出し。`PageTitle` / `AdminPageTitle` と同じ箱にグレー帯（`PageTitleSkeleton`）を置く。スケルトンで `PageTitle` に `PageTitleSkeleton` を入れない — 空の h1 が本物より先に初期 HTML へ出る
- `SectionTitleSkeleton` — 見出しのプレースホルダ。矩形で代用せずこれを使う（`SectionTitle` 自身を描画するため実物と高さ・形が一致する）
- `icons/OutlineIcon` — 線画アイコンの svg 外殻。新しい線画アイコンはこれを使う
- `HighlightPanel` — 地の文から浮かせて読ませる琥珀色の囲み（教本のコラム・計算手順・注意書き）。`border-amber-500 bg-amber-50/60` の一式をページ側で直接書かない
- `SettingsCard` / `SettingToggleRow` — 設定ページの項目カードとトグル行。設定項目を足すときに `<input type="checkbox">` とスイッチの markup を書き起こさない
- `HelpIconButton` — 「押すと説明が出る」入口の「?」（設定の補足・ドラの見方・練習の進め方）。送信ボタンと
  同じ緑の塗りの丸に白抜きの太字で、大きさは添える文字に合わせて em で決まる。素の「?」の文字や線画の
  アイコンをページ側で書かない（地の文に紛れて押せることが伝わらない）
- ヘルプは 2 種類。`HelpTourModal`（`practice/_components/`）は練習の設定画面の「?」から、開始前に
  流れを実コンポーネントのカルーセルで通しで見せる。`SpotlightTour`（driver.js、`(user)/_components/`）は
  練習の play 画面や道場の見出しの「?」から、今画面にある要素を順に照らして 1〜2 文で説明する。段階で
  画面が変わる練習は全段階の手順を渡し、無い要素はツアーが飛ばす（`data-tour-id` で対象を引く）。
  説明を文章のモーダルで読ませない。ページの見方の説明を見出しと本文の間の地の文に置かない —
  `PageTitle` の `action` に「?」を置いてツアーへ逃がす（道場が前例）

### 影

影は「押せる」の記号。`shadow-*` を持つのは次の 2 つだけ。

- 押せる面 — ボタン（`buttonClasses()` が `press-*` と一緒に付ける）、カード全体が
  リンクになっているもの、トグルのつまみ
- 最外の白カード（`ContentContainer` の `sm:shadow-lg`）— 地の斜線から浮かせる 1 枚

押せないもの（表示だけのカード・表・見出し・モーダルパネル・トースト・
アイコンの丸）には付けない。区切りは太枠（`border-3` / `border-4 border-ink`）が
持つ。マイページのカードが既定の姿。

管理画面（`data-skin="plain"`）は別のビジュアル言語のため対象外。

### ボタン（`apps/web/src/app/(user)/_components/`）

- `Button` — `<button>` のボタン。`LinkButton` — `next/link` のボタン
- 見た目は `_lib/button-classes.ts` の `buttonClasses()` に集約。`border-3 border-ink bg-primary-500 ...` のような一式をページ側で直接書かない
- `variant`（primary / secondary / neutral / danger / warning / dangerOutline）、`size`（sm / md / lg / xl）、`fullWidth`、`disabled` で指定する。`className` は余白などレイアウト調整用で、色・枠・影を上書きしない
- 無効時は `disabled` を渡す。呼び出し側で `<span aria-disabled>` を書き分けない（`LinkButton` が span を描画する）
- 外部リンクの `<a>` など上記に乗らない要素には `buttonClasses()` を直接使う
- 「押せる面」（カード全体がリンクになっているもの。`LinkRow` 等）はボタンではないため対象外
- 管理画面（`/admin`）は別のビジュアル言語のため対象外。`(user)/_components/` に置いているのはその意思表示でもある

### テキストリンク（`apps/web/src/app/_components/_lib/link-classes.ts`）

管理画面でも使うため `app/_components/` 側に置いている。

テキストリンクは `TEXT_LINK_CLASSES`（グレー + 常時下線）の 1 種類だけ。
本文中のリンクもページ間の移動もこれを `className` に貼る。緑（primary）は
ボタン＝「押して始める面」の色として取ってあるためリンクには使わない
（緑なら始まる / グレーの下線なら移動する）。強調したい導線が出てきたら、
リンクの色ではなくボタンで示す。
`text-primary-* hover:underline` のようなリンクの class をページ側で直接書かない。
リンク風の `<button>` にも同じ定数を使う。行全体がクリック対象になるもの
（`LinkRow` 等）は行の中のタイトルに `ROW_LINK_TITLE_CLASSES` を使う
（hover が行に追随する版）。下線は常時引く — hover でしか出ない
アフォーダンスはタッチ端末では一切見えない。

## ローディング境界（loading.tsx）

`src/app/loading-boundaries.test.ts` が「**動的ルートは祖先に loading.tsx を
ちょうど 1 つ持ち、静的ルートは持たない**」ことを検査する。どのルートが動的か
（`next build` の route table で ƒ）はテスト内の `DYNAMIC_ROUTES` に写してあり、
`pnpm build` 後は `.next` の manifest と突き合わせる。ページを動的にしたとき
（cookie を読む・`searchParams` を使う・`force-dynamic` を付ける）は、この一覧と
loading.tsx を一緒に足すこと。逆に静的にしたら両方を外す。

- **静的ルートに置かない** — loading.tsx はページ全体を包む Suspense 境界で、
  React（Fizz）は完了済みの境界でも中身が 12.8KB（既に流したバイト数との累計）を
  超えると fallback を先に書き、本文を応答末尾の `<div hidden>` + `$RC()` に回す。
  これは静的生成の HTML にもそのまま焼き込まれ、境界を持つ静的ページは初期 HTML の
  `<main>` がスケルトンだけになる（2026-09 に本番で実測）。Google は JS を実行する
  ので索引には影響しないが、JS を実行しないクローラー・SNS プレビューには本文が
  見えず、空の見出しが本物より先に出る。静的ルートは `<Link>` が全量プリフェッチ
  するので遷移スケルトンはそもそも出ず、境界を外して失うのは「プリフェッチが
  間に合わなかったときのスケルトン」だけ
- **動的ルートには leaf に置く** — React は遷移中、マウント済みの Suspense の
  フォールバックを出さない。祖先の共通 loading.tsx は同じセグメント内の遷移
  （`/lessons` → `/lessons/x` 等）で効かず、サーバ応答までクリックが無反応になる
- **入れ子にしない** — `<Link>` のプリフェッチは最も外側の境界までしか取らないため、
  内側の個別スケルトンは速いサーバでは一度も出ず、遅いサーバでは本文直前に一瞬出るだけになる
  （2026-08 に本番ビルドで実測）
- 静的な親と動的な子が同居するルートは、動的な子の leaf にだけ置く
  （`practice/<slug>/result/loading.tsx`、`exam/<級>/play/loading.tsx`）。index だけ
  動的なときは page.tsx と loading.tsx を route group に退避する
  （`lessons/(index)`, `mypage/(home)`, `admin/(dashboard)`, `admin/users/(list)`）
- **祖先に loading.tsx があると `notFound()` は 404 を返さない** — Suspense の
  フォールバックを流し始めた時点でヘッダが確定するため、ページ本体でも
  `generateMetadata` でも `notFound()` はソフト 404（200）になる（2026-08 に
  本番ビルドで実測）。slug を事前に列挙できるルートは
  `generateStaticParams` + `export const dynamicParams = false` で弾くこと。
  未知の slug がページを描画する前にルーティングで落ちるため、本物の 404 に
  なる（`/reference/glossary/[slug]` 参照）。ただしこれが効くのは静的ルート
  だけで、cookie を読む動的ルートでは列挙しても未知の slug が描画まで進み
  200 になる（2026-10 に本番ビルドで実測、`/dojo/ranks/[slug]`）。そうした
  ルートや列挙できない DB 由来の動的ルート（`/announcements/[slug]`,
  `/u/[username]`）は 200 のまま残るが、Next が
  not-found の描画に `<meta name="robots" content="noindex">` を自動で入れる
  ため索引はされない。ページ側で noindex を足す必要はない
- ドロップダウン等のメニュー内 `<Link>` は閉じている間も mount したままにする（`invisible` + `inert`）。
  開くまで unmount しているとプリフェッチが開いてから始まり、すぐ押すとサーバ応答まで無反応になる。
  Next 16 の Segment Cache では動的ルートの prefetch に 2 往復（`/_tree` → loading 境界）かかる。
  `router.prefetch()` で先読みする案は Link 自身のプリフェッチと干渉して逆に遅くなったので使わない
  （`auth-nav-item.tsx` 参照）

## ボタンの下の補助リンクの余白（`apps/web/src/app/_components/_lib/spacing.ts`）

ボタンの下に「移動するだけ」のテキストリンクを添える構造（結果画面の
「練習一覧に戻る」、登録 CTA の「ログイン」、設定ゲートの「ログイン」、
マイレコードの「練習一覧へ」）の間隔は `SUB_LINK_GAP`（`gap-4` = 16px）に
統一する。押し間違いを防ぐ縦のタップ間隔として `PracticeFooterActions` が
定めている `gap-3`（12px）より一段広く、「ボタンの一部ではない」ことを
距離で示す値。

- **必ず gap で当てる。** リンク側に `pt-*` / `mt-*` を足して差を作らない —
  親の `space-y-*` との合算になり、実際の余白がその場所の親によって変わる
- ボタンが複数並ぶときは、ボタン群を `gap-3` の内側コンテナに包み、その外側に
  `SUB_LINK_GAP` を当てる（`result-view.tsx` が既定の姿）
- 結果画面の登録 CTA の高さはこの余白に連動する。値を変えたら
  `ResultBlockSection` の `min-h` を実測し直すこと
- 余白の定数を増やすときの方針（役割ベースで育てる・値ベースの表を作らない・
  構造まで同じならコンポーネントに昇格）は `spacing.ts` のモジュール TSDoc を参照

## 角丸

素の `rounded` は Tailwind の非推奨トークン `--radius`（0.25rem 固定）を参照しており、
`globals.css` で取り直した `--radius-*` の影響を受けない。丸みを揃えたい箇所では
`rounded-md` 以降のサイズ付きユーティリティを使うこと。

## 行間

本文の行間は `globals.css` の `@theme` で `--leading-relaxed` を取り直して一元管理する。
長文の段落には `leading-relaxed` を付けるだけでよく、ページ個別に `leading-*` の
数値を上書きしない。全体の行間を変えたいときは `--leading-relaxed` を触ること。

## 牌画像（@pai-forge/mahjong-react-ui）

- `Hai` コンポーネントで牌を表示。画像は `public/tiles/*.webp`（静的ファイル）を参照する —
  ルートレイアウトの `AppTileImageProvider`（`src/app/_contexts/tile-image-context.tsx`）が
  パッケージの `TileImageProvider` で参照先を差し替えている。パッケージ既定の
  base64 埋め込み（data URI）に戻さないこと。牌を並べるページの HTML が 1〜5MB になる
- `public/tiles/` は `pnpm --filter web tiles:generate` で生成する（パッケージ同梱の PNG を
  144×192 の WebP に縮小）。パッケージを更新したら再実行する。`src/app/tile-assets.test.ts` が
  牌の一覧と生成物の一致を検査する
- `Hai` の `alt` は省略時に牌の名前（一萬・東 等）。装飾として並べるだけなら `alt=""` を渡す
- React Native 対応パッケージのため `apps/web/src/shims/react-native.ts` で web 用 shim を提供
- ライブラリの `styles.css` は Tailwind v4 と競合するためインポート禁止。牌サイズクラスは `globals.css` に抽出済み
- `Hai` を使うコンポーネントは `"use client"` が必要

## チャレンジモード（練習共通仕様）

- 制限時間 60 秒、ミス 3 回で終了
- ページ遷移直後にカウントダウンオーバーレイ（3, 2, 1）→ タイマー開始
- 「準備はいいですか？」のような確認画面は出さない
- 共通フック: `packages/features/src/session/` に `use-timed-session.ts`, `use-game-timer.ts`, `use-countdown.ts`。
  web は `practice/_hooks/use-timed-session.ts` 等の薄いラッパー（スクロールと端末ローカル設定を渡す）を通して使う
- 円形タイマー: `apps/web/src/app/(public)/practice/_components/quiz-timer.tsx`

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
/api/stripe/checkout/complete — Checkout 完了の着地（所有者検証 → 同期記録 → /mypage/plan）
```

### 練習ページ構成パターン

練習種別により2つのパターンが存在する:

| パターン     | 構成                           | 該当                                                              |
| ------------ | ------------------------------ | ----------------------------------------------------------------- |
| チャレンジ型 | 説明(page.tsx) → play → result | jantou-fu, mentsu-fu, machi-fu, mentsu-jantou-fu, yaku, han-count |
| 無限訓練型   | play のみ（result なし）       | score, machi-score                                                |

- `score-calculation`, `score-table` はチャレンジ型だが説明ページ（page.tsx）は未作成
- `score` / `machi-score` は終了条件がなく無限ループする訓練機能のため、result ページを持たない。
  どちらも `PRACTICE_MENU_REGISTRY` に載らず、練習一覧のバナー（`comprehensive-practice-banner.tsx`）と
  `sitemap-routes.ts` の手書きの 1 行で参照する
- `machi-score`（待ち別点数計算）は 1 問を「待ち牌を選ぶ → 待ち × ツモ/ロン のマスに点数を当てはめる →
  答え合わせ」の 3 段階で解く。設定画面・回答フォーム・結果表は `score` のものを共有し、設定の保存名だけ分ける

## 出題設定（バリアント）と記録の土俵

チャレンジの記録は `(menu_type, leaderboard_key)` の土俵ごとに積まれ、ランキング・
マイレコード・自己ベストの比較もその単位で引く。`leaderboard_key` は出題設定の
**バリアント**で、`PRACTICE_MENU_REGISTRY` の `variants` に列挙したキー
（設定を持たない練習は `DEFAULT_VARIANT` = `"default"`）。

- **練習の設定は、レジストリに列挙した少数のバリアントから 1 つ選ぶ形に限る。**
  チェックボックスの自由な組み合わせは作らない — 列挙できない設定は土俵に
  名前を付けて並べることも比較することもできない
- バリアントのキーは URL の `?variant=`・`leaderboard_key`・辞書キー
  （`<namespace>.variants.<key>.{label,hint}`）で同じ文字列を使う。変換の表を持たない
- 読む側は必ず `resolvePracticeVariant()` で正規化する（未指定・不正値は先頭の既定）。
  盤面・保存・結果ページ・ランキングが同じ URL から同じ土俵に着地するため
- 説明ページの選択 UI は共通の `VariantStartPanel`。練習ごとに設定 UI を書かない
- `/preferences` のルール設定（連風牌4符・切り上げ満貫等）は端末ローカルで、
  `leaderboard_key` に載せない（端末を変えた瞬間に記録が別の土俵へ飛ぶ）。
  代わりにチャレンジ（記録あり）では設定で正解が割れる手を出題から落とし、
  点数の選択肢を設定に依らない集合に固定する（`practice/_lib/rule-boundary.ts`）。
  トレーニングは設定どおりに出題する
- 昇級試験は記録を残さない（`submitExamResult` が合否だけ判定して `user_ranks` に
  付与する）。`savePracticeResult` は試験の menuType を入口で弾く

## 点数計算・黒帯への道（段級位の行程）

段級位（5級 → … → 初段 = 黒帯）を 1 本の道として見せる。級ごとに
「学ぶ（レッスン）→ 練習する → 認定される（試験）」の 3 段を持ち、計算は
`packages/features/src/journey/journey.ts` の `buildJourney()` に一本化する。
ダッシュボードの「次にやること」・道場の行程・登録直後の案内はすべてこれを読む。
置き場所ごとに「次」を別々に決めない（ホームと道場で指す先が食い違う）。

- **ホームは「今すること 1 つ」、道場は「全体の道筋」。** ダッシュボードは
  次に取る級の中で最初の未了を 1 つだけカードに出す（候補を並べない）。
  道場は次の目標の級を開いて上に置き、その下に全級を閉じたカードで並べる
  （次の目標の級も道の中では閉じる。中身を 2 回出さない）
- **ページの名前は「道場」（`/dojo`）、journey はコードの中だけの名前。** 道場は
  現在の段級位と黒帯への道を見せるページで、級の詳細（`/dojo/ranks/<級>`）も
  その配下に置く。journey は道場・ダッシュボード・レッスンが読む行程の計算
  （`buildJourney()`）の名前で、UI に「ジャーニー」を出さず、`/journey` のような
  ルートも作らない。URL は画面の呼び名に合わせる（`/lessons` と同じ理由）。
  `/journey` は道場の中身の一部（行程）しか表さず、段級位・黒帯という武道の
  比喩からも外れるため採らなかった
- **学ぶ段はどの章も「本文 → 確認問題 → 完了」のレッスンに揃える。**
  「学んだ」はレッスンの完了で、段級位の前提章（5級〜1級）はすべて確認問題を
  持つ。前提章を足すときは確認問題も一緒に用意する（持たない章だけ確認を
  経ずに進む歩になる）
- **「練習した」は一度でも挑戦したこと。** 習得の判定は試験が持つ。
  トレーニングは記録が無いので数えない。練習と試験はレッスンに置き換えない
- **順序は案内であって強制ではない。** 受験資格は従来どおり級の順序だけ
  （`evaluateExamEligibility`）。前提のレッスンの完了を受験の条件にしない。経験者は
  道場や試験ページから直接受けられる。鍵を掛けるのは試験の順序だけで、
  EXP レベル等で教材や練習を鍵付きにしない
- 登録直後（レッスン・挑戦・級がすべて無い = `isFresh`）は最初のレッスンへ
  送る。見出しは常に「次にやること」で、初回だけ別の見出しや初回限定のカードは持たない

## 認証（Email + Google OAuth）

### 環境変数

- `NEXT_PUBLIC_SITE_URL` — 認証コールバック URL の生成に使用。本番環境では本番 URL を設定すること

### 本番環境の Supabase Dashboard 設定（必須）

メール認証を本番環境で動作させるには、以下の設定が必要:

1. **Authentication > Providers > Email**: Email provider を有効化
2. **Authentication > Settings**:
   - "Confirm email" を有効化
   - "Secure password change" を有効化
   - "Double confirm email changes" を有効化
   - Minimum password length: `6`
   - Password requirements: `letters_digits`
3. **Authentication > URL Configuration**:
   - Site URL を本番 URL に設定
   - Redirect URLs に本番 URL を追加

これらの設定は `apps/web/supabase/config.toml` のローカル設定と同期させること。

### アーキテクチャ

- IP ベースのインメモリレートリミット（`src/lib/rate-limit-ip.ts`）+ Supabase サーバーサイドレートリミットの二重防御
- アカウント列挙防止: サインインは汎用エラー、パスワードリセットは常に成功を返す
- パスワードバリデーション: Zod スキーマ（`src/lib/validations/password.ts`）で client/server 両方で検証

### 管理者ロールの割り当て

管理画面（`/admin`）は `requireAdmin()`（`src/app/admin/_lib/auth.ts`）で `user_roles` テーブルの `role = 'admin'` を検証する。ロールを付与する UI は無い。

ローカルでは開発用シードを使う:

```bash
pnpm --filter web db:seed:dev
```

管理者（`admin@example.local`）と一般ユーザー8人（`alice@`（無級）/ `bob@`（5級）/ `erin@`（4級）/ `frank@`（3級）/ `grace@`（2級）/ `heidi@`（1級）/ `carol@`（最上位の段級位）/ `dave@`（無級・Pro を手動付与）、いずれも `example.local`）を投入する。パスワードはいずれも `devpass1`、メール確認済みなのでそのままサインインできる。冪等なので何度実行してもよい。DB と Supabase の両方がローカルホストでなければ実行を拒否する。実装は `apps/web/scripts/dev-seed.ts`。

段級位を持つユーザーには `user_ranks` と前提のレッスンの完了（次に取る級の前提章を含む）が入る。道場の「現在の段級位」と黒帯への道の開いた級、ダッシュボードの「次にやること」（学び終えているので練習か試験を指す）を、ログインするだけで確認できる。無級の alice では「次にやること」が最初のレッスンを指す（チャレンジ成績が入っているため `isFresh` ではなく、最初のレッスン向けの文言にはならない。その状態は登録したての本物のアカウントで見る）。

これに加えて、ランキングの母集団を作るためだけの `seed_player01`〜`seed_player20`（`player01@example.local` …）を投入する。上位3位のメダル・ページ送り・1 ページに収まらない自分の順位を出す「あなた」の行は、人数が足りないと画面に出ないため。全シードユーザーに全練習種別（昇級試験を除く。試験は本番でも記録されない）のチャレンジ成績（当月と前月の 2 件ずつ）が入り、総合・月間の両方のランキングが埋まる。成績の値はユーザー名から決まる擬似乱数なので、何度実行しても順位は変わらない。ただしシードユーザーの既存の成績・段級位・レッスンの完了は宣言された状態へ消して入れ直すため、シードユーザーとして遊んだ記録は残らない。EXP は付与しないので、EXP の画面を見たいときは実際に練習を 1 回走らせること。

有料プラン（`purchases`）は bob に有効な 30 日パス 1 枚と期限切れのパス 1 枚、carol に買い切りを入れる（偽の Stripe ID。Stripe API は叩かない）。alice は購入なしで、無料枠の回数制限が掛かる状態。`stripe_customers` には入れない — 偽の顧客 ID があるとシードユーザーで Checkout を試したときに Stripe 側に存在しない顧客を渡して失敗するため。特典の手動付与（`benefit_grants`）は dave に 60 日の付与 1 件（付与者は admin、購入なし）を入れる。マイページの「Pro（付与）」と管理画面の付与一覧（`/admin/benefit-grants`）の取り消しがこれで試せる。

ネイティブ広告も、本番のシード（`scripts/seed/ad-creatives.ts`）と同じ広告と、ローカル用の架空の Amazon トラッキング ID を入れる（`scripts/dev-seed/ad-creatives.ts`）。ASIN で指す広告はトラッキング ID が無いと画面に出ないため、これで配置と見た目をログインなしで確かめられる。管理画面（`/admin/ads`）で編集しても、次の実行で戻る。

既存のアカウントを管理者にしたい場合は DB に直接 INSERT する:

1. 対象ユーザーをメールアドレスで通常登録する（`auth.users` に行ができる）
2. 以下の SQL で admin ロールを付与する（ローカル Supabase の Postgres は `127.0.0.1:54322`）:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = '<email>'
ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING;
"
```

`psql` が無い場合は Supabase Studio（`http://127.0.0.1:54323`）の Table Editor か `pnpm --filter web db:studio`（Drizzle Studio）で `user_roles` に行を追加してもよい。

## Supabase ローカル環境

Supabase CLI は `apps/web` の devDependency として同梱している（`supabase/config.toml` が
CLI のバージョンと結合しているため）。グローバルインストール版ではなく、必ず `apps/web` から
`pnpm supabase ...` で同梱版を実行すること。

```bash
cd apps/web
pnpm supabase start          # 起動（初回は Docker イメージのダウンロード）
pnpm supabase status -o json # API キーの取得
pnpm supabase stop           # 停止
```

- Supabase Studio: http://127.0.0.1:54323
- Mailpit（メールテスト用）: http://127.0.0.1:54324
- PostgreSQL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### `config.config has invalid keys` が出たら

`pnpm supabase` は同梱版が未インストールだと黙ってグローバル版（Homebrew 等）に
フォールバックする。古いグローバル版が新しい `config.toml` のキーを知らないため、
`failed to parse config: 'config.config' has invalid keys: <キー名>` になる。
`config.toml` を書き換えるのではなく `pnpm install` を実行し、
`pnpm supabase --version` が `apps/web/package.json` の devDependency と
一致することを確認すること。

## Claude Code クラウドセッション

claude.ai/code・Claude モバイルアプリの Code タブ・`claude --cloud` から始めるセッションは、
Anthropic 管理の VM（Ubuntu 24.04、Node 20/21/22 のみ、Docker あり）に新規 clone された
状態で始まる。`.env.local` も DB も無い。リポジトリ側に、そこでローカルと同じ作業ができる
仕掛けを置いている。スクリプトは dotagents のスキル `claude-cloud-session-bootstrap` から
配備した汎用のもので、**リポジトリ固有の値は `scripts/claude-cloud/config.sh` だけ**。
汎用スクリプトを直したいときはスキル側を直して `bootstrap.py --update` で配り直す。

- `.claude/settings.json` の SessionStart hook が `scripts/claude-cloud/session-start.sh` を
  実行する。`CLAUDE_CODE_REMOTE=true`（VM だけ）でなければ即終了するので、ローカルと
  GitHub Actions には影響しない。VM では Node 24 を PATH の先頭に置き（`CLAUDE_ENV_FILE`
  経由で以降のコマンドにも効く）、依存を揃え、できること・できないことの
  サマリを Claude に渡す
- `scripts/claude-cloud/setup-environment.sh` は claude.ai 側の環境の **Setup script** に
  貼るもの。Node 24 + pnpm を VM のスナップショットに入れておき、毎セッションの再インストール
  を避ける。リポジトリ非依存なので、他のリポジトリと同じ環境を共有できる。貼っていなくても
  hook がフォールバックで入れる（毎回数十秒遅くなるだけ）
- `bash scripts/claude-cloud/stack-up.sh` — Docker で Supabase を起動（`-x edge-runtime,...`。
  VM は rlimit を引き上げられず、CLI が edge-runtime にだけ付ける `--ulimit` で `supabase start`
  全体が落ちるため）、`.env.local` を `supabase status` から生成、`db:run-migrate` →
  `db:seed` → `db:seed:dev`、`next dev` を起動する。冪等。VM 以外では `.env.local` を壊さないよう実行を
  拒否する
- `bash scripts/claude-cloud/screenshot.sh /practice --login alice` — `/opt/pw-browsers` の
  Chromium（Chrome for Testing のダウンロードは VM から 403）でデスクトップ幅とスマホ幅を撮る。
  Claude が PNG を Read で開くとチャットに画像が出る。UI を変えたら両方の幅を見せる
- 品質ゲート（`pnpm lint` / `pnpm typecheck` / `pnpm test`）と上の 2 スクリプトは
  `permissions.allow` で事前許可してあり、スマホからの操作が権限プロンプトで止まらない
- VM でできないこと: 本番のシークレット（Google OAuth、Resend、GA）が要る確認。
  それは Remote Control か手元で行う

### Preview デプロイの DB は Supabase Branching から来る

`next build` は Postgres に繋がらないと完走しない（`src/app/sitemap.ts` が `announcements` を
SELECT する）。Preview を本番 DB に向ける選択は無い — `prebuild`（`scripts/prebuild-db.ts`）が
接続文字列を見て Drizzle の migrate を走らせるので、feature ブランチのマイグレーションが
本番に流れる。代わりに PR ごとに Supabase の **preview branch**（空の DB を持つ隔離インスタンス）
を使う。PR を開くと Supabase がブランチを作り、その接続情報を Vercel に **PR の git ブランチ
限定の Preview 変数**（本番連携と同じ 16 キー: `POSTGRES_*` / `SUPABASE_*` /
`NEXT_PUBLIC_SUPABASE_*`）として書き込み、再デプロイを起動する。空の DB は Vercel ビルドの
`prebuild` → `migrate.ts` が `supabase_auth_admin` ロールを検出して Drizzle のマイグレーションと
`drizzle/supabase/*.sql` を適用することでブートストラップされる。`supabase/migrations/` は
使っていないので Supabase 側の migrate / seed は何もしない。

PR のマージまたはクローズでブランチは削除され、従量課金（Micro 約 $0.32/日。Pro の
Compute Credits の対象外）も止まる。PR を何週間も開けたままにしない。

`claude/*` の PR（クラウドセッション・issue パイプライン）にも他と同じく Preview が立つ。
Supabase の連携はブランチ名で絞れず PR ごとに必ずブランチを作るので、`vercel.json` の
`ignoreCommand` で `claude/*` のビルドだけ止めると「DB に課金だけして Preview は立たない」
状態になる。そのため `vercel.json` に `ignoreCommand` を置かない（regions / crons は別）。

依存するダッシュボード設定（Supabase プロジェクト → Settings → Integrations）。どれも
失敗時の症状が「DB 未接続」と同じに見える:

- **GitHub integration の「Supabase changes only」: OFF。** ON だと `apps/web/supabase/` に
  変更の無い PR は無視され（bot が "no changes detected" とコメント）、スキーマが
  `apps/web/drizzle/` にあるこのリポジトリではどの PR も条件を満たさない。症状は
  `connect ECONNREFUSED 127.0.0.1:54322`（`scripts/_lib/database-url.ts` のローカル既定値へ
  フォールバック）
- **Vercel integration の「Preview」同期トグル: OFF。** 本番の接続文字列と service role key を
  Preview 全体にコピーする設定。ブランチ限定の同期はトグル OFF のまま PR open 時に行われる
- **Working directory: `apps/web`**（`supabase/` の親）。**Automatic branching: ON。
  Deploy to production: OFF** — 本番スキーマは本番ビルドの `prebuild` が適用する

設定を直した後に既存 PR へ再適用するには PR を close → reopen する。

preview branch の既知の穴: `config.toml` の `site_url = "http://localhost:3000"` のため Preview URL
では認証のリダイレクトが戻らず、本番ダッシュボードだけで設定した項目（OAuth の secret 等）は
複製されない。ビルドには影響しない。手順の正本は dotagents のスキル
`vercel-preview-supabase-branching`。

## Database Migration

- **Always use `pnpm db:run-migrate`** — This runs `scripts/migrate.ts`, which executes Drizzle migrations and then applies Supabase-specific SQL (RLS policies, FK constraints) in Supabase environments.
- **本番の初期データは `pnpm db:seed`**（`scripts/seed.ts`）— prebuild がマイグレーションの後に走らせる。宣言した行のうち DB に無いものだけを入れ（id 単位の insert-only）、既存の行は管理画面の編集ごと DB が正。いまはネイティブ広告（ASIN で本を指す。トラッキング ID は管理画面で設定するまで無く、それまで画面に出ない）だけ
- **Do NOT use `drizzle-kit push`** — `push` bypasses migration tracking and directly syncs the schema. This causes the migration journal and actual DB state to diverge.
- **Schema changes workflow**: Edit `src/lib/db/schema.ts` → run `npx drizzle-kit generate --name=<migration_name>` → run `pnpm db:run-migrate`
- **Always specify `--name` when generating migrations** — Use snake_case (e.g., `create_profiles_table`, `add_avatar_to_profiles`)
- **Migration file structure**:
  - `drizzle/*.sql` + `drizzle/meta/` — Drizzle-managed migrations (auto-generated)
  - `drizzle/supabase/` — Supabase-specific SQL (RLS, FK, permissions). Applied by `migrate.ts` in Supabase environments.

## Feature Documentation

機能固有のドキュメントは各機能の `page.tsx` に TSDoc コメントとして記述する。グローバルファイル（この CLAUDE.md 等）の肥大化を避けるため。

### 規約

- **Feature Name** — 1行目に機能名を記載する（例: `練習一覧`）。セッション中のキーワード grep 用
- `@description` — 機能の目的・概要
- `@flow` — ユーザーの操作フロー・画面遷移

コードから自明な情報（ルート、意味のある名前のクエリパラメータなど）は記述しない。

## コミットルール

- ユーザーが明示的に指示した場合のみコミットする
