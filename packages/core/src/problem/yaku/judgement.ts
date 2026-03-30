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
  if (correctYakuNames.length !== userSelectedYaku.length) return false;

  const expectedSet = new Set(correctYakuNames);
  const userSet = new Set(userSelectedYaku);

  if (expectedSet.size !== userSet.size) return false;

  for (const yaku of expectedSet) {
    if (!userSet.has(yaku)) return false;
  }

  return true;
}
