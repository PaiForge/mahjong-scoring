# packages/core — ドメインロジック

問題の生成・採点・点数の算術など、UI に依らない麻雀のロジック。`@pai-forge/riichi-mahjong` に依存する。
ここを触るときは次の 2 つを読む（別リポジトリで管理する共有文書。SHA で固定している）:

- コーディング規約 — https://raw.githubusercontent.com/PaiForge/docs/0b464878e4e24b6b8c154d90f96e1657e212ddaa/coding-standards.md
  （麻雀用語はローマ字、TSDoc にユビキタス言語（日本語）を併記、`as` 禁止、例外ではなく `Result`）
- Extended MPSZ（牌の表記法）の仕様 — https://raw.githubusercontent.com/PaiForge/extended-mpsz/72ee9ede74583d58587bc8c6ed36166bb808b5bd/SPEC.md
  （手牌を文字列で書く・読むコードとテストのフィクスチャで要る）

## 牌の並び（理牌）

牌の順（萬子 → 筒子 → 索子 → 字牌、赤 5 は 5 の直後）を決めるのは riichi-mahjong だけ。
アプリで順を書き起こさない。

- 牌の列は `sortHaiCodes` / `compareHaiCode`、手牌は `sortTehai`（純手牌だけ理牌し、副露は鳴いた順のまま）
- 面子・雀頭を手牌の左から右の順に並べる表は `sortBlocksByTehai` / `sortHouraBlocksByTehai`
- 手牌がアプリに入る入口で必ず理牌する: 問題の生成（`finalizeTehai14` / `finalizeTehai13`）、
  MPSZ の読み込み（`parseTehai` / `parseHais`）、コードに書いた手牌（`buildDemoTehai` /
  `defineDemoHand`）、テストで手牌を組み立てる関数。表示側（`TehaiHand`）は受け取った順に並べる
- `(a, b) => a - b` を `sort` / `toSorted` に渡すことは ESLint（ルートの `eslint.config.mjs`）が
  弾く。牌かどうかを lint で見分けられないため。数値は `compareNumbers` で並べる
- 問題・採点・解説のデータは理牌済みのまま持つ。練習の盤面の**表示だけ**を
  `packages/features/src/board/hand-presentation.ts`（上下の向きと並びの置換）で変えられる。
  置換は理牌済みの並びに対する添字で、牌の順の定義をアプリに複製しない（詳細は同ファイルの TSDoc）

## 名前

- `core/score-table-math.ts` は点数表の算術（符・翻 → 区分と支払い）。練習の「点数計算」
  （`problem/score/`、features の `practice/score-calculation/`）とは別物
- アプリ（Static Hermes）でも動くため、`toSorted` / `Object.groupBy` 等の Hermes に無い組み込みは
  ESLint が弾く（理由と一覧は `eslint.config.mjs`）
