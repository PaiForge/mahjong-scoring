# apps/web/src/app — 画面の規約

web の App Router 配下だけに関わる規約。用語・ルート構成・バリアント・黒帯への道などの
アプリ全体の方針はルートの `CLAUDE.md`、DB・認証・Supabase・デプロイは `apps/web/CLAUDE.md`。

## コロケーション

ルート規約ファイル（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 等）以外のディレクトリには
`_` プレフィックスを付ける（`_components/` `_hooks/` `_lib/`）。App Router のルート解決対象から
外れ、ルートセグメントと区別できる。

`(list)` / `(index)` / `(home)` / `(dashboard)` / `(form)` の route group は、index ページだけが動的な
ときに page.tsx と loading.tsx を退避して、ローディング境界が兄弟ルート（`[id]` 等）の祖先に
ならないようにするためのもの（下の「ローディング境界」）。loading.tsx を持つ group
（`dojo/(index)`・`mypage/(home)`・`admin/users/(list)` 等）から一段上へ動かすと
`loading-boundaries.test.ts` が落ちる。page.tsx だけの group（`lessons/(index)`・`practice/(index)`・
`reference/(index)` 等）は、ページが静的になって loading.tsx を外した跡で、group 自体は境界の
役目を持たない（URL にも出ない）。そのページを動的に戻すときは、その group に loading.tsx を置く。

## `"use client"`

- 本当にクライアント側の機能（hooks, event handlers, browser API）が必要な場合のみ付与する
- `useTranslations()` だけのために付けない。サーバーコンポーネントでは `getTranslations()`
  from `next-intl/server` を使う
- 新規コンポーネントはサーバーコンポーネントとして実装できないか必ず検討する
- `Hai`（牌画像）を使うコンポーネントには必要

## 共通 UI コンポーネント

置き場所は 2 つ。ディレクトリで「管理画面が使うか」を表現している。

| ディレクトリ                                    | 中身                                                                                                                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/_components/`                 | ユーザー向け画面と管理画面（`/admin`）で共有するもの。`BrandLogo` / `GoogleIcon` / `SkeletonBar` / `PageTitleSkeleton` / `ModalShell` / `GlobalToaster` / `ScrollReset` / `HashAnchorScroll` / `_lib/link-classes` のみ |
| `apps/web/src/app/[locale]/(user)/_components/` | ブランド UI（細線・フラット・丸ゴシックの世界）。上記以外はすべてここ                                                                                                                                                   |

新しい共通コンポーネントは原則 `[locale]/(user)/_components/` に置く。`app/_components/` へ足すのは
管理画面からも使うときだけ。`app/_components/` と `admin/` から `[locale]/(user)/_components/` を
import しない（依存の向きを一方向に保つ。ルートの `eslint.config.mjs` が弾く）。

`<html>` を持つルートレイアウトは `[locale]/layout.tsx`（ユーザー向け。`lang` は URL の言語）と
`admin/layout.tsx`（管理画面）の 2 つ。`app/layout.tsx` は素通しで、`app/not-found.tsx`（どの言語の
ルートにも当たらない URL の 404）と `app/global-error.tsx` は自分で `<html>` を描く。

管理画面（`data-skin="plain"`）は別のビジュアル言語。ページ送りも `AdminPaginationNav` を持ち、
ボタン・入力欄・状態チップは `admin/_lib/` の `adminButtonClasses()` / `ADMIN_INPUT_CLASSES` /
`adminChipClasses()` に集約しており、ページ側で一式を直接書かない。

### 主なコンポーネント

- `PageTitle` — h1。全ページで使用
- `SectionTitle` — h2。左の短い縦線・文字・右へ伸びる淡い横線。ページは「PageTitle → SectionTitle → 本文」の
  型を保つ。見出しの文言が分かりにくくても、見出しを外して導入文に置き換えない（案内は見出しの下に足す）
- `ContentContainer` — ページコンテンツの max-w-3xl ラッパー。全ページで統一して使用し CLS を防ぐ
- `Sidebar` / `MobileHeader` / `MobileTabBar` — ナビゲーションシェル
- `DataTable` / `DataTableHeaderCell` — データテーブルの外枠と見出しセル。表を作るときは直接 `<table>` を書かない
- `LinkRow` / `LinkRowList` — 読む・見るためのリンク 1 行とその枠。ボタン（緑や帯色の塗り）は「押して始める面」（練習・試験・登録）の記号なので、ページを読みに行くだけ / 一覧を見に行くだけの導線はカードにせずこれを使う
- `SkeletonBar` — 読み込み中のプレースホルダ矩形。`animate-pulse` と背景色を直接書かない。角丸は `radius`（md / lg / xl / full）で指定し、`className` に `rounded*` を書かない
- `PageTitlePlaceholder` / `AdminPageTitlePlaceholder` — 読み込み中の見出し。`PageTitle` / `AdminPageTitle` と同じ箱にグレー帯（`PageTitleSkeleton`）を置く。スケルトンで `PageTitle` に `PageTitleSkeleton` を入れない — 空の h1 が本物より先に初期 HTML へ出る
- `SectionTitleSkeleton` — 見出しのプレースホルダ。矩形で代用せずこれを使う（`SectionTitle` 自身を描画するため実物と高さ・形が一致する）
- `icons/OutlineIcon` — 線画アイコンの svg 外殻。新しい線画アイコンはこれを使う
- `ModalCloseButton` — モーダルの見出しの右に置く × の閉じるボタン。説明・早見表・ヘルプツアー・選択肢の一覧のような「閉じても何も失わない」モーダルに下端のボタンと併設する。× をモーダルごとに書き起こさない。確認モーダルと入力を持つダイアログには置かない（× がキャンセルか分かりにくく、入力が消える）
- `HighlightPanel` — 地の文から浮かせて読ませる琥珀色の囲み（教本のコラム・計算手順・注意書き）。`border-amber-500 bg-amber-50/60` の一式をページ側で直接書かない
- `SettingsCard` / `SettingToggleRow` — 設定ページの項目カードとトグル行。設定項目を足すときに `<input type="checkbox">` とスイッチの markup を書き起こさない
- `HelpIconButton` — 「押すと説明が出る」入口の「?」（設定の補足・ドラの見方・練習の進め方）。送信ボタンと
  同じ緑の塗りの丸に白抜きの太字で、大きさは添える文字に合わせて em で決まる。素の「?」の文字や線画の
  アイコンをページ側で書かない（地の文に紛れて押せることが伝わらない）
- ヘルプは 2 種類。`HelpTourModal`（`practice/_components/`）は練習の設定画面の「?」から、開始前に
  流れを実コンポーネントのカルーセルで通しで見せる。`SpotlightTour`（driver.js、`[locale]/(user)/_components/`）は
  練習の play 画面や道場の見出しの「?」から、今画面にある要素を順に照らして 1〜2 文で説明する。段階で
  画面が変わる練習は全段階の手順を渡し、無い要素はツアーが飛ばす（`data-tour-id` で対象を引く）。
  説明を文章のモーダルで読ませない。ページの見方の説明を見出しと本文の間の地の文に置かない —
  `PageTitle` の `action` に「?」を置いてツアーへ逃がす（道場が前例）

### 線と影（フラット）

ユーザー向け画面はフラット。線は 1px の淡い `border-panel`（`--color-border` と同値）で
統一し、太枠（`border-3` / `border-4`）・右下へずらした濃色の影・押し込みの移動・
地の斜線・文字の影は使わない（2026-10 にホームを基準に全体へ揃えた）。情報の優先順位は
線の太さではなく、塗り（ボタンの緑・段級位の帯色・状態色）と文字の大きさで示す。

- 地に置かれた面（`ContentContainer` の白カード・情報カード・表・ボタン）は影を持たない
- `shadow-*` は Tailwind 既定の柔らかい影で、画面の上に浮く層（モーダル・ドロワー・
  アカウントメニュー・トースト）だけに使う
- フォーム部品（select・テキスト入力・選択肢のタイル）の枠は一段濃い灰
  （`border-surface-300` / `border-surface-400`）。選択中はリング（`ring-1 ring-inset`）を足して
  塗りだけに頼らない。押せるものには `FOCUS_RING_CLASSES` を付ける
- 段級位のカードは上端だけ帯色の `border-t-2`（1px では淡い級が細線に紛れる）
- hover / active は色だけを変え、位置を動かさない（`hover:-translate-*` や `scale` を使わない）

管理画面（`data-skin="plain"`）は別のビジュアル言語のため対象外。アプリ（`apps/mobile`）は
同じ規則に従う（RN での組み方は `apps/mobile/CLAUDE.md`）。

### 色の役割

緑は「押して始める面」の記号なので、`primary-*` の段を画面側で選ばず、役割の
トークンで引く（定義と値の根拠は `globals.css`、アプリは `apps/mobile/src/lib/theme.ts` に同じ名前・同じ値）。

| 役割       | トークン                            | 使う所                                                               |
| ---------- | ----------------------------------- | -------------------------------------------------------------------- |
| 主操作     | `action`（#007a3d）                 | 主ボタン・「?」・トグルのオン。緑の塗りはこれだけ                    |
| 選択中     | `selected`（墨）/ `selected-subtle` | タブ・絞り込み・ページ送り・選択肢のタイル・ナビの現在地。緑にしない |
| 補助面     | `brand-subtle`                      | 次の目標・自分の行・特典の囲み・小さな値のチップ。淡緑はこの 1 値    |
| 正解・完了 | `success`                           | 正誤の正解・役の正解チップ・済みマーク・正答バー                     |
| 採点待ち   | `pending` / `pending-border`        | 押した選択肢が採点を待つ間。正誤のどちらとも読めない灰               |

選択中のタイルは `[locale]/(user)/_components/_lib/selection-classes.ts`（アプリは `InsetRing` + `colors.selected`）。
麻雀卓（`primary-800`）・ヒートマップ・段級位の帯色・教材カテゴリ・順位の色はそれぞれの
役割の色で、ここには寄せない。表の見出し・本文中の強調値・メニューの hover は緑にしない。

### ボタン（`[locale]/(user)/_components/`）

- `Button` — `<button>` のボタン。`LinkButton` — `next/link` のボタン
- 見た目は `[locale]/(user)/_components/_lib/button-classes.ts` の `buttonClasses()` に集約。`border bg-primary-500 ...` のような一式をページ側で直接書かない
- `variant`（primary / secondary / neutral / danger / warning / dangerOutline）、`size`（sm / md / lg / xl）、`fullWidth`、`disabled` で指定する。`className` は余白などレイアウト調整用で、色・枠・影を上書きしない
- 無効時は `disabled` を渡す。呼び出し側で `<span aria-disabled>` を書き分けない（`LinkButton` が span を描画する）
- 外部リンクの `<a>` など上記に乗らない要素には `buttonClasses()` を直接使う
- 「押せる面」（カード全体がリンクになっているもの。`LinkRow` 等）はボタンではないため対象外
- 管理画面（`/admin`）は別のビジュアル言語のため対象外。`[locale]/(user)/_components/` に置いているのはその意思表示でもある

### テキストリンク（`_components/_lib/link-classes.ts`）

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

### 余白・角丸・行間

- ボタンの下に「移動するだけ」のテキストリンクを添える構造の間隔は `SUB_LINK_GAP`
  （`_components/_lib/spacing.ts`）。必ず gap で当て、リンク側に `pt-*` / `mt-*` を足さない。
  値の根拠・育て方（役割ベースで足す・値ベースの表を作らない）は `spacing.ts` の TSDoc
- 素の `rounded` は Tailwind の非推奨トークン `--radius`（0.25rem 固定）を参照しており、
  `globals.css` で取り直した `--radius-*` の影響を受けない。`rounded-md` 以降のサイズ付きを使う
- 本文の行間は `globals.css` の `@theme` の `--leading-relaxed` で一元管理する。長文の段落には
  `leading-relaxed` を付けるだけでよく、ページ個別に `leading-*` の数値を上書きしない

## ローディング境界（loading.tsx）

不変条件は「**動的ルートは祖先に loading.tsx をちょうど 1 つ持ち、静的ルートは持たない**」。
理由（静的ページの初期 HTML が空になる・入れ子は内側が出ない・マウント済みの境界は
遷移で効かない）と実測の記録は `loading-boundaries.test.ts` の頭にある。ここには操作だけ書く。

- ページを動的にしたとき（cookie を読む・`searchParams` を使う・`force-dynamic` を付ける）は、
  テストの `DYNAMIC_ROUTES` と leaf の loading.tsx を一緒に足す。静的にしたら両方を外す
  （閲覧者に依る部分をクライアントで後から付けて静的にした前例が `/lessons`。完了の印は
  Server Action で取る。経緯は `DYNAMIC_ROUTES` の TSDoc）。新しい練習の `/practice/<slug>/result` も動的
- 静的な親と動的な子が同居するルートは、動的な子の leaf にだけ置く
  （`practice/<slug>/result/loading.tsx`、`exam/<級>/play/loading.tsx`）。index だけ動的なときは
  page.tsx と loading.tsx を route group に退避する（`dojo/(index)`, `leaderboard/(index)`,
  `mypage/(home)`, `admin/(dashboard)`, `admin/users/(list)`）
- ページを消した・改名したあとは `apps/web` で `npx next build` を回して `.next` を作り直してから
  tsc とテストを見る。`.next/types/validator.ts`（tsconfig が include）が消したページを参照したまま
  残って tsc が「Cannot find module …/page.js」で落ち、このテストも古い manifest と突き合わせて
  落ちる。どちらもソースの誤りではない（急ぐなら validator.ts だけ消せば tsc は通る。manifest 側の
  テストはビルドが無ければ skip される）
- **祖先に loading.tsx があると `notFound()` は 404 を返さない**（ソフト 404 = 200）。slug を事前に
  列挙できる静的ルートは `generateStaticParams` + `export const dynamicParams = false` で弾く
  （`/reference/glossary/[slug]`）。cookie を読む動的ルート（`/dojo/ranks/[slug]`）や DB 由来の
  動的ルート（`/announcements/[slug]`, `/u/[username]`）は 200 のまま残るが、Next が not-found の
  描画に `<meta name="robots" content="noindex">` を入れるため索引はされない。ページ側で noindex を
  足す必要はない（詳細はそれぞれの page.tsx の TSDoc）
- ドロップダウン等のメニュー内 `<Link>` は閉じている間も mount したままにする（`invisible` + `inert`。
  `auth-nav-item.tsx`）。開くまで unmount しているとプリフェッチが開いてから始まり、すぐ押すと
  サーバ応答まで無反応になる。`router.prefetch()` で先読みする案は Link 自身のプリフェッチと干渉して
  逆に遅くなったので使わない
- ページを開いた瞬間から画面にある常設のリンク（ヘッダー・タブバー）は `DeferredPrefetchLink` を使う
  （理由は同ファイルの TSDoc）。閉じたドロワー（`NavMenu`）の中のリンクは、開きそうな操作
  （ボタンへの pointerenter / focus）か開いた時点まで `prefetch={false}` にする。本文の主導線
  （LP のヒーローの CTA 等）は素の `<Link>` のまま

## 牌画像（@pai-forge/mahjong-react-ui）

- `Hai` コンポーネントで牌を表示。画像は `public/tiles/*.webp`（静的ファイル）を参照する —
  ルートレイアウト（`[locale]/layout.tsx`・`admin/layout.tsx`）の `AppTileImageProvider`（`_contexts/tile-image-context.tsx`）が
  パッケージの `TileImageProvider` で参照先を差し替えている。パッケージ既定の
  base64 埋め込み（data URI）に戻さないこと。牌を並べるページの HTML が 1〜5MB になる
- `public/tiles/` は `pnpm --filter web tiles:generate` で生成する。パッケージを更新したら
  再実行する。`tile-assets.test.ts` が牌の一覧と生成物の一致を検査する
- `Hai` の `alt` は省略時に牌の名前（一萬・東 等）。装飾として並べるだけなら `alt=""` を渡す
- ライブラリの `styles.css` は Tailwind v4 と競合するためインポート禁止。牌サイズクラスは `globals.css` に抽出済み
- React Native 対応パッケージのため `apps/web/src/shims/react-native.ts` で web 用 shim を提供

## チャレンジモード（練習共通）

制限時間 60 秒・ミス 3 回で終了。ページ遷移直後にカウントダウン（3, 2, 1）→ タイマー開始で、
「準備はいいですか？」のような確認画面は出さない。共通フックは `packages/features/src/session/`
（`use-timed-session.ts`, `use-game-timer.ts`, `use-countdown.ts`）で、web は
`[locale]/(user)/(public)/practice/_hooks/use-timed-session.ts` 等の薄いラッパー（スクロールと端末ローカル設定を渡す）を
通して使う。円形タイマーは `[locale]/(user)/(public)/practice/_components/quiz-timer.tsx`。

## 文言

UI に日本語をベタ書きしない。辞書は `packages/messages/src/ja/<名前空間>.json`
（ルートの `CLAUDE.md`「i18n」）。`next start` の HTML をボタンの文言で grep しても描画の確認に
ならない — クライアント用の名前空間の辞書が全ページの RSC ペイロードに丸ごと載る
（`src/i18n/client-messages.ts`）ため、どのページでも当たる。描画の有無は ICU の引数が埋まった形
（「確認問題へ（4 問）」）や `<h1>` / `aria-label` などマークアップ付きで grep するか、ブラウザで見る。

## Feature Documentation

機能固有のドキュメントは各機能の `page.tsx` に TSDoc で書く（グローバルの文書を肥大化させない）。

- **Feature Name** — 1 行目に機能名（例: `練習一覧`）。セッション中のキーワード grep 用
- `@description` — 機能の目的・概要
- `@flow` — ユーザーの操作フロー・画面遷移

コードから自明な情報（ルート、意味のある名前のクエリパラメータなど）は書かない。
