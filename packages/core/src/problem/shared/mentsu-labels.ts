/**
 * 面子の符に関わる表示語彙
 * 面子符ラベル
 *
 * 「么九牌 / 中張牌」「明 / 暗」は符の内訳表示と出題の解説文の両方で使う。
 * 文の組み立て方は用途で違う（内訳は "么九牌暗刻子"、解説は
 * "么九牌の暗刻は4符です"）ため、語彙だけをここで一本化する。
 */

/** 么九牌 / 中張牌 */
export function yaochuLabel(isYaochu: boolean): string {
  return isYaochu ? "么九牌" : "中張牌";
}

/** 明 / 暗（副露しているか） */
export function openLabel(isOpen: boolean): string {
  return isOpen ? "明" : "暗";
}
