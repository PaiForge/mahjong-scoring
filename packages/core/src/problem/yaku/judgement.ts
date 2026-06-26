import { setsEqual } from "../shared/set-equal";

/**
 * ユーザーが選択した役が正解と完全一致するかを判定する
 * 役選択判定
 *
 * @param correctYakuNames - 正解の役名リスト
 * @param userSelectedYaku - ユーザーが選択した役名リスト
 * @returns 完全一致なら true
 */
export function judgeYakuAnswer(
  correctYakuNames: readonly string[],
  userSelectedYaku: readonly string[],
): boolean {
  // 重複選択（同じ役を2回など）は不正解とするため、Set 化前に件数を比較する
  if (correctYakuNames.length !== userSelectedYaku.length) return false;
  return setsEqual(correctYakuNames, userSelectedYaku);
}
