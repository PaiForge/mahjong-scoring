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
import { defineConfig } from "@mizchi/mutator";

export default defineConfig({
  include: ["src/**/*.ts"],
  exclude: [
    "src/test/**",
    "src/**/*.fixture.ts",
    "src/**/test-fixtures.ts",
    "src/**/use-*.ts",
  ],
  reporters: ["text", "html", "json"],
  failOnSurvived: false,
});
