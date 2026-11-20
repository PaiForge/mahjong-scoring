// ミューテーションテストの設定（`pnpm --filter @mahjong-scoring/core mutation`）。
//
// 目的はテストの検出力の実測であって、合否ゲートではない。等価ミュータント（書き換えても
// 観測できる振る舞いが変わらないもの）が原理的に残るので 100% は目標にしない。
// 循環的複雑度と同じく「どこのテストを足すと効くか・どこが要らないコードか」を探す
// リファクタリングの指標として読む。そのため `failOnSurvived: false` とし、
// `thresholds.break` も置かない（既定の null のまま）。`turbo.json` のタスクにも
// `pnpm test` にも載せない — `pnpm test`（= `turbo run test`）は issue solver と
// クラウドセッションの品質ゲートで、そこに分単位の処理と実行ごとに揺れる結果（下記）を
// 入れないため。
//
// ツールは @mizchi/mutator を package.json で 0.3.0 に厳密固定している（キャレットなし）。
// 差分実行（`--since`）・キャッシュ・型チェックによる事前除外で速いことが採用理由だが、
// 0.x で設定キーやレポート形式が版ごとに変わりうる（未知のキーは終了コード 1）ので、
// 更新は意図して行う。StrykerJS は vitest を上げずに動くが、遅さを理由に置き換えられた
// 側なので採らなかった。
//
// `*.test.*` と `__tests__/` はツールが既定で除外し、`exclude` はその既定に追加される
// ので、ここではテストファイルを除く指定をしない。`exclude` に挙げた `src/test/**` と
// `src/test-utils/**` はテストからだけ使う補助（シード付き乱数・手牌の組み立て等）で、
// 本番コードではないから書き換えても検出力の測定にならない。テストの隣に置く固定データ
// （`test-fixtures.ts`・`*.fixture.ts`）も同じ理由で外す — どちらの名前もツールの既定の
// 除外に当たらず、外さないと固定データの書き換えが生存・タイムアウトとして数えられる。
// テストランナーは同じディレクトリの `vitest.config.ts` を自動で読む。
//
// 出題ジェネレータの統計的テスト（シードなしの乱数で数百〜数万回試行して分布や網羅を
// 見るもの）だけが殺すミュータントは、生死が乱数の標本に依り、実行ごとに Killed /
// Survived が入れ替わりうる。それでも次のものはここに置かない:
// - 統計的テストを外した別の vitest 設定（`vitestConfig`）: 外しても速くならず、基準値
//   だけが歪む。`Math.random` を 1000 回以上呼ぶテスト 68 件を外して全件を測ったところ
//   （2026-11）、Killed が 72 件減り、実行時間は 632 秒から 748 秒に延びた。ミュータントの
//   回は最初に落ちたテストで打ち切られるので、早く殺すテストを外すと、覆うテストを最後まで
//   走らせる回と Timeout（3 倍の時間で再実行される）が増える。なお全テストの時間で最も
//   重いのは統計的テストではなく、シード付きの `problem/archive/round-trip.test.ts`
// - 統計的テストのシードの固定: 統計的に網羅するというテストの性質を変えるので、
//   そのまま残す。代わりに、同じ振る舞いを乱数を注入した（`src/test/seeded-random.ts`）
//   決定的なテストでも検証する。上の 72 件はそうして閉じた。統計的テストだけが殺す
//   ミュータントを新しく見つけたら、同じくシード付きのテストを足す
// - `timeBudget`・`mutantsPerLine`: 設定に書くと「全件」が黙って部分実行になる。日常は
//   `--since <ref>` の差分実行で回し、上限が要るときはその場でフラグとして渡す
//
// RuntimeError は偽の検出を含む。閉じたと数えるのは Killed だけにする。0.3.0 の vitest
// アダプタは 1 つの Vitest インスタンスでミュータントを順に走らせ、前の回で読み込みに
// 失敗したテストファイルを後続の回にも数えるので、テストが 1 つも落ちていない回が
// RuntimeError になる（仕組みと、設定のキーで避けられない理由は features の
// `mutator.config.ts` のコメント）。core でも起きることを確かめた: `src/score/tiers.ts` の
// `index === -1` を `false` にするミュータントは、`src/problem/tenpai-score/generator.ts`・
// `src/problem/score/judgement.ts` と一緒に回すと RuntimeError（`killedBy` は
// `hand-skeleton.test.ts`・`mentsu-structure.test.ts`）になり、`.mutator/` を消して
// `--only` で単独に回すと Survived になった。core で前の回の読み込み失敗を引き起こした
// ミュータントは特定していない。ファイルを絞っても残るので、真偽は `--only <key>` で
// 1 件ずつ確かめる（手順はルートの CLAUDE.md「ミューテーションテスト」）
import { defineConfig } from "@mizchi/mutator";

export default defineConfig({
  include: ["src/**/*.ts"],
  exclude: [
    "src/test/**",
    "src/test-utils/**",
    "src/**/test-fixtures.ts",
    "src/**/*.fixture.ts",
  ],
  reporters: ["text", "html", "json"],
  failOnSurvived: false,
});
