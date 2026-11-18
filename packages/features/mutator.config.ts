// ミューテーションテストの設定（`pnpm --filter @mahjong-scoring/features mutation`）。
//
// 目的はテストの検出力の実測であって、合否ゲートではない。等価ミュータント（書き換えても
// 観測できる振る舞いが変わらないもの）が原理的に残るので 100% は目標にしない。
// 循環的複雑度と同じく「どこのテストを足すと効くか・どこが要らないコードか」を探す
// リファクタリングの指標として読む。そのため `failOnSurvived: false` とし、
// `thresholds.break` も置かない（既定の null のまま）。`turbo.json` のタスクにも
// `pnpm test` にも載せない — `pnpm test`（= `turbo run test`）は issue solver と
// クラウドセッションの品質ゲートで、そこに分単位の処理を入れないため。
//
// ツールは @mizchi/mutator を package.json で 0.3.0 に厳密固定している（キャレットなし）。
// 差分実行（`--since`）・キャッシュ・型チェックによる事前除外で速いことが採用理由だが、
// 0.x で設定キーやレポート形式が版ごとに変わりうる（未知のキーは終了コード 1）ので、
// 更新は意図して行う。StrykerJS は vitest を上げずに動くが、遅さを理由に置き換えられた
// 側なので採らなかった。
//
// `*.test.*` と `__tests__/` はツールが既定で除外し、`exclude` はその既定に追加される
// ので、ここではテストファイルを除く指定をしない。テストランナーは同じディレクトリの
// `vitest.config.ts` を自動で読む。`exclude` に挙げたもの:
// - `src/test/**`: テストからだけ使う補助（メモリのストレージ・タイマー・intl のラッパー等）。
//   本番コードではないから書き換えても検出力の測定にならない
// - `src/**/*.fixture.ts`・`src/**/test-fixtures.ts`: テストの隣に置く固定データ。
//   上と同じ理由で外す。どちらの名前もツールの既定の除外に当たらない
// - `src/**/use-*.ts`: フック・ストアのファイル。features で React・zustand・use-intl に
//   触れてよいのはこの層だけで、テストは jsdom + testing-library で描画を介すので
//   ミュータントごとの再実行が重く、描画やモックに対するテストは殺しても品質の証拠に
//   なりにくい。それ以外のファイルが純粋であることはルートの `eslint.config.mjs` が
//   同じ glob（`packages/features/src/**/use-*.ts`）を境界にして保証しているので、
//   対象の定義を新しく作らずその境界に合わせる。境界の glob を変えるときはここも揃える
// - `src/glossary/terms/**`・`src/account/reserved-usernames.ts`: 中身がデータの定義
//   （用語の定義・予約語の配列）で、文字列 1 つの書き換えを検出するにはテストにデータを
//   写すしかない。固定データを外したのと同じ理由。`reserved-usernames.ts` の関数は
//   `Set.has` の 1 行（`isReservedUsername`）で、ユーザー名の判定の入口
//   （`account/username.ts` のテスト）から検証される。同じ用語集でも `src/glossary/kana.ts`
//   は行の振り分けとアンカーの関数を持つので外さない
//
// RuntimeError は偽の検出を含む。閉じたと数えるのは Killed だけにする。0.3.0 の vitest
// アダプタは 1 つの Vitest インスタンスでミュータントを順に走らせ、各回の結果を
// `runTestSpecifications()` の戻り値から読むが、Vitest（5.1）はそこにそれまでの回の
// テストファイルも累積して返す。読み込み時に例外を投げる静的ミュータント（例:
// `results/result-schemas.ts` の zod の判別キー `"type"` を `""` にすると、
// discriminatedUnion の組み立てでモジュールの評価が落ちる）が一度出ると、そのテスト
// ファイル群の読み込み失敗が、それらを走らせ直すかインスタンスを作り直す（Timeout の後）
// まで後続の回にも数えられ、テストが 1 つも落ちていない回が RuntimeError になる
// （`killedBy` には書き換えたファイルと無関係なテストファイルが並ぶ）。確かめた事実:
// `account/reserved-usernames.ts` の予約語 1 つを `""` にしてもテストは全部通るのに、
// `account` と `results` を一緒に回すと RuntimeError と報告され、`.mutator/` を消して
// `--only <key>` で単独に回すと Survived になった。確認のための再実行も同じインスタンスで
// 走るので直らない。Killed は選んだテストの失敗だけから決まり、Survived は読み込み失敗が
// 1 つでもあれば付かないので、この 2 つは影響を受けない。設定のキー（`concurrency`・
// `vitestConfig` 等）にはインスタンスを回ごとに作り直すものも、前の回の結果を除くものも
// 無いので、設定では避けられない。読み込みを壊すミュータントは範囲を広げるほど後続に
// 無関係な回が増えるので、全件の実行で最も多く出る。信頼できる測り方と RuntimeError の
// 確かめ方はルートの CLAUDE.md「ミューテーションテスト」
import { defineConfig } from "@mizchi/mutator";

export default defineConfig({
  include: ["src/**/*.ts"],
  exclude: [
    "src/test/**",
    "src/**/*.fixture.ts",
    "src/**/test-fixtures.ts",
    "src/**/use-*.ts",
    "src/glossary/terms/**",
    "src/account/reserved-usernames.ts",
  ],
  reporters: ["text", "html", "json"],
  failOnSurvived: false,
});
