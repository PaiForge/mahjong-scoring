/**
 * 点数の入力方式
 *
 * - `tiles` — 「満貫未満 / 満貫以上」の切り替えで片側だけをタイルで並べ、
 *   1 タップで答える。select では選択肢が多すぎる（子ロンで 30 個、子ツモの
 *   組で 21 組）ため、満貫かどうかを先に決めて候補を半分以下にする。子ツモは
 *   常に組（`300/500`）のタイルで答え、子ツモの入力方式（{@link import("./ko-tsumo-input").KoTsumoInputMode}）
 *   の `split` は効かない — 2 つのタイル群は互いに連動せず、片側だけでは帯を決められないため
 * - `select` — 従来の select
 *
 * 出題も正解判定も変えない「操作の形」の選択。
 */
export type ScoreInputMode = "tiles" | "select";

/** 候補が少なく 1 タップで答えられる tiles を既定にする */
export const DEFAULT_SCORE_INPUT: ScoreInputMode = "tiles";
