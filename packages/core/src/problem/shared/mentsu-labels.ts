/**
 * 面子の符に関わる表示語彙
 * 面子符ラベル
 *
 * 「么九牌 / 中張牌」「明 / 暗」は符の内訳表示（"么九牌暗刻子"）で使う。
 * 文の組み立ては呼び出し側の責務で、ここは語彙だけを持つ。
 */

/** 么九牌 / 中張牌 */
export function yaochuLabel(isYaochu: boolean): string {
  return isYaochu ? "么九牌" : "中張牌";
}

/** 明 / 暗（副露しているか） */
export function openLabel(isOpen: boolean): string {
  return isOpen ? "明" : "暗";
}
