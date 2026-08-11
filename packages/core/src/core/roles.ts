/**
 * 和了者の立場と和了方法
 * 立場・和了方法
 *
 * 「親/子」「ロン/ツモ」という2値軸の唯一の定義。
 * 出題・点数計算・点数表・学習ページはすべてここから引く。
 */

/** 親 / 子 */
export type Role = "oya" | "ko";

/** ロン / ツモ */
export type WinType = "tsumo" | "ron";

/** Role 型ガード */
export function isRole(value: string): value is Role {
  return value === "oya" || value === "ko";
}

/** WinType 型ガード */
export function isWinType(value: string): value is WinType {
  return value === "tsumo" || value === "ron";
}
