import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";

/**
 * 待ち牌の判定後の牌 1 枚の状態
 * 牌の判定
 *
 * - `correct`: 待ちで、選んだ
 * - `extra`: 待ちではないのに選んだ
 * - `missed`: 待ちだが選ばなかった
 */
export type MachiTileMark = "correct" | "extra" | "missed";

/**
 * 判定後の牌の枠と背景
 *
 * 待ち牌を選ぶ画面（`MachiPicker`）と答え合わせ（`MachiScoreResult`）で
 * 同じ語彙を使う。
 * 回答した直後に牌の一覧が色を変え、そのあと答え合わせで同じ色をもう一度
 * 見ることになるので、緑 / 赤 / 緑の破線の意味が画面で食い違わないよう
 * 1 か所に置く。見落とし（`missed`）だけ破線なのは、選んでいない牌を
 * 塗ると「選んだ」ように見えるため。
 */
export const MACHI_TILE_MARK_CLASSES: Readonly<Record<MachiTileMark, string>> =
  {
    correct: "border-success bg-success-subtle",
    extra: "border-destructive bg-destructive-subtle",
    missed: "border-success border-dashed bg-white",
  };

/**
 * 牌 1 枚の判定を引く
 * 牌の判定引き
 *
 * @param selected - その牌を選んでいるか
 * @param judgement - 待ち牌の判定。回答前（undefined）はどの印も付かない
 */
export function machiTileMark(
  hai: HaiKindId,
  selected: boolean,
  judgement: MachiSelectionJudgement | undefined,
): MachiTileMark | undefined {
  if (!judgement) return undefined;
  if (judgement.extra.includes(hai)) return "extra";
  if (judgement.missed.includes(hai)) return "missed";
  if (selected && judgement.correct.includes(hai)) return "correct";
  return undefined;
}
